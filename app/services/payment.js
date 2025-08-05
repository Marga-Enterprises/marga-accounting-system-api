// models and sequelize imports
const { 
    Payment, 
    PaymentCheque,
    PaymentPDC, 
    PaymentOnlineTransfer, 
    Collection, 
    ClientDepartment, 
    Billing,
    Client 
} = require('@models');
const { Op } = require('sequelize');

// validator functions
const {
    validatePaymentFields,
    validatePaymentId,
    validateListPaymentsParams
} = require('@validators/payment');

// utility redis client
const { clearPaymentsCache, clearCollectionsCache } = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');


// service to create a new payment
exports.createPaymentService = async (data) => {
    const {
        payment_collection_id,
        payment_or_number,
        payment_invoice_number,
        payment_amount,
        payment_2307_amount,
        payment_has_2307,
        payment_mode,
        payment_remarks,
        payment_cheque_number,
        payment_cheque_date,
        payment_online_transfer_reference_number,
        payment_online_transfer_date,
        payment_pdc_number,
        payment_pdc_date,
        payment_date,
        payment_posting_date,
        payment_collection_date,
        payment_pdc_deposit_date,
        payment_pdc_credit_date,
        payment_client_tin,
    } = data;

    // Validate input
    validatePaymentFields(data);

    // Retrieve collection and its relations
    const collection = await Collection.findOne({
        where: { id: payment_collection_id },
        include: [{
            model: Billing,
            as: 'billing',
            include: [{
                model: ClientDepartment,
                as: 'department',
                include: [{
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'client_name', 'client_tin']
                }],
                attributes: ['client_department_name', 'client_department_address']
            }],
            attributes: ['billing_date']
        }]
    });

    if (!collection) {
        const error = new Error('Collection not found');
        error.statusCode = 404;
        throw error;
    }

    // Check invoice number match
    if (collection.collection_invoice_number !== payment_invoice_number) {
        const error = new Error('Payment invoice number does not match the collection invoice number.');
        error.statusCode = 400;
        throw error;
    }

    // Check for duplicate OR number (unless cancelled)
    const existingPayment = await Payment.findOne({
        where: {
            payment_or_number,
            payment_is_cancelled: false
        }
    });

    if (existingPayment) {
        const error = new Error('Payment with this OR number already exists.');
        error.statusCode = 409;
        throw error;
    }

    // Check and update client TIN if needed
    const client = collection.billing.department.client;
    if (payment_client_tin && client) {
        const existingTIN = client.client_tin?.trim() || '';
        const incomingTIN = payment_client_tin.trim();

        if (!existingTIN || existingTIN !== incomingTIN) {
            await Client.update(
                { client_tin: incomingTIN },
                { where: { id: client.id } }
            );
            // Optional: update locally for downstream logic
            client.client_tin = incomingTIN;
        }
    }

    // Parse amounts
    const parsedPaymentAmount = parseFloat(payment_amount);
    const parsedPayment2307Amount = payment_2307_amount ? parseFloat(payment_2307_amount) : 0.00;
    const collectionBalance = parseFloat(collection.collection_balance);
    const collectionAmount = parseFloat(collection.collection_amount);

    // Create main payment
    const newPayment = await Payment.create({
        payment_collection_id,
        payment_invoice_number,
        payment_or_number,
        payment_amount: parsedPaymentAmount,
        payment_amount_paid: parsedPaymentAmount - parsedPayment2307Amount,
        payment_2307_amount: parsedPayment2307Amount,
        payment_has_2307,
        payment_mode,
        payment_remarks,
        payment_date,
        payment_posting_date,
        payment_collection_date,
        payment_invoice_date: collection.billing.billing_date,
    });

    // Create sub-records based on payment mode
    switch (payment_mode) {
        case 'cash':
            break;

        case 'cheque':
            await PaymentCheque.create({
                id: newPayment.id,
                payment_cheque_number,
                payment_cheque_date,
            });
            break;

        case 'online_transfer':
            await PaymentOnlineTransfer.create({
                id: newPayment.id,
                payment_online_transfer_reference_number,
                payment_online_transfer_date,
            });
            break;

        case 'pdc':
            await PaymentPDC.create({
                id: newPayment.id,
                payment_pdc_number,
                payment_pdc_date,
                payment_pdc_deposit_date,
                payment_pdc_credit_date,
            });
            break;

        default:
            const error = new Error('Invalid payment mode');
            error.statusCode = 400;
            throw error;
    }

    // Update collection balance or status
    if (collectionBalance === 0.00) {
        const collectionNewBalance = collectionAmount - parsedPaymentAmount;

        if (collectionAmount > parsedPaymentAmount) {
            await Collection.update(
                { collection_balance: collectionNewBalance },
                { where: { id: payment_collection_id } }
            );
        } else {
            await Collection.update(
                { collection_status: 'paid' },
                { where: { id: payment_collection_id } }
            );
        }
    } else {
        const collectionNewBalance = collectionBalance - parsedPaymentAmount;

        if (collectionBalance > parsedPaymentAmount) {
            await Collection.update(
                { collection_balance: collectionNewBalance },
                { where: { id: payment_collection_id } }
            );
        } else {
            await Collection.update(
                {
                    collection_status: 'paid',
                    collection_balance: collectionNewBalance < 0 ? 0.00 : collectionNewBalance
                },
                { where: { id: payment_collection_id } }
            );
        }
    }

    // Clear caches
    await clearPaymentsCache();
    await clearCollectionsCache();

    return newPayment;
};


// service to list all payments
exports.getAllPaymentsService = async (params) => {
    // validate input parameters
    validateListPaymentsParams(params);

    // get query parameters
    let { pageIndex, pageSize, search, type } = params;

    // set default values for pagination
    pageIndex = parseInt(pageIndex) || 0;
    pageSize = parseInt(pageSize) || 10;
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // redis cache key
    const cacheKey = `payments:page:${pageIndex}:${pageSize}:${search || ''}:${type || ''}`;
    const cachedPayments = await redisClient.get(cacheKey);

    if (cachedPayments) {
        return JSON.parse(cachedPayments);
    }

    // build where clause
    const whereClause = {
        ...(type ? { payment_mode: type } : {}),
        ...(search?.trim()
            ? {
                [Op.or]: [
                    { payment_invoice_number: { [Op.like]: `%${search}%` } },
                    { payment_or_number: { [Op.like]: `%${search}%` } },
                    { '$collection.billing.department.client_department_name$': { [Op.like]: `%${search}%` } }
                ]
            }
            : {})
    };


    // fetch payments with associated collection and client department
    const { count, rows } = await Payment.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        offset,
        limit,
        include: [
            {
                model: Collection,
                as: 'collection',
                include: [
                    {
                        model: Billing,
                        as: 'billing',
                        attributes: ['billing_department_id'],
                        include: [
                            {
                                model: ClientDepartment,
                                as: 'department',
                                include: [
                                    {
                                        model: Client,
                                        as: 'client',
                                        attributes: ['client_name', 'client_tin']
                                    }
                                ],
                                attributes: ['client_department_name', 'client_department_address']
                            }
                        ]
                    }
                ]
            },
            {
                model: PaymentCheque,
                as: 'cheque',
                attributes: ['payment_cheque_number', 'payment_cheque_date']
            },
            {
                model: PaymentOnlineTransfer,
                as: 'onlineTransfer',
                attributes: ['payment_online_transfer_reference_number', 'payment_online_transfer_date']
            },
            {
                model: PaymentPDC,
                as: 'pdc',
                attributes: ['payment_pdc_number', 'payment_pdc_date', 'payment_pdc_deposit_date', 'payment_pdc_credit_date']
            }
        ],
    });

    // calculate total pages
    const totalPages = Math.ceil(count / pageSize);

    // prepare the response object
    const response = {
        pageIndex,
        pageSize,
        totalRecords: count,
        totalPages,
        payments: rows,
    };

    // cache the response
    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600);

    return response;
};


// service to get a payment by ID
exports.getPaymentByIdService = async (paymentId) => {
    // validate payment ID
    validatePaymentId(paymentId);

    // create cache key
    const cacheKey = `payment:${paymentId}`;
    const cachedPayment = await redisClient.get(cacheKey);
    if (cachedPayment) {
        return JSON.parse(cachedPayment);
    }

    // fetch payment by ID with associated collection and client department
    const payment = await Payment.findOne({
        where: { id: paymentId },
        include: [
            {
                model: Collection,
                as: 'collection',
                include: [
                    {
                        model: Billing,
                        as: 'billing',
                        attributes: ['billing_department_id'],
                        include: [
                            {
                                model: ClientDepartment,
                                as: 'department',
                                attributes: ['client_department_name']
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (!payment) {
        const error = new Error('Payment not found');
        error.statusCode = 404; // Not Found
        throw error;
    }

    // cache the payment data
    await redisClient.set(cacheKey, JSON.stringify(payment), 'EX', 3600);

    return payment;
};


// cancel payment service
exports.cancelPaymentService = async (paymentId) => {
    // validate payment ID
    validatePaymentId(paymentId);

    // get the existing payment 
    const payment = await Payment.findByPk(paymentId);

    // check if payment exists
    if (!payment) {
        const Error = new Error('Payment not found');
        Error.statusCode = 404; // Not Found
        throw Error;
    }

    // get the collection associated with the payment
    const collection = await Collection.findByPk(payment.payment_collection_id);

    // check if collection exists
    if (!collection) {
        const Error = new Error('Collection not found');
        Error.statusCode = 404; // Not Found
        throw Error;
    }

    // parse the payment amount, collection balance, and collection amount
    const paymentAmount = parseFloat(payment.payment_amount);
    const collectionBalance = parseFloat(collection.collection_balance);
    const collectionAmount = parseFloat(collection.collection_amount);

    // set the payment_is_cancelled field to true and set the collection status to 'pending'
    await payment.update({ payment_is_cancelled: true });

    // check if the collection amount is equal to the payment amount
    if (collectionAmount === paymentAmount) {
        await Collection.update(
            { collection_status: 'pending' },
            { where: { id: payment.payment_collection_id } }
        );
    } else {
        if (collectionBalance === 0.00) {
            // If the collection balance is zero, it means this was the first payment
            await Collection.update(
                { collection_balance: collectionAmount - paymentAmount },
                { where: { id: payment.payment_collection_id } }
            );
        } else {
            // If there are existing payments, adjust the balance accordingly
            const collectionNewBalance = collectionBalance + paymentAmount;

            await Collection.update(
                { collection_balance: collectionNewBalance },
                { where: { id: payment.payment_collection_id } }
            );
        }
    };

    // clear cache for payments and collections
    await clearPaymentsCache(collection.id);
    await clearCollectionsCache(paymentId);

    return { message: 'Payment cancelled successfully' };
}