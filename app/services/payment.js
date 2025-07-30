// models and sequelize imports
const { 
    Payment, 
    PaymentCheque,
    PaymentPDC, 
    PaymentOnlineTransfer, 
    Collection, 
    ClientDepartment, 
    Billing 
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
        payment_amount,
        payment_mode,
        payment_remarks,
        payment_cheque_number,
        payment_cheque_date,
        payment_online_transfer_reference_number,
        payment_online_transfer_date,
        payment_pdc_number,
        payment_pdc_date,
        payment_pdc_deposit_date,
        payment_pdc_credit_date
    } = data;

    // validate input fields
    validatePaymentFields(data);

    // convert payment amount to a number with two decimal places
    const amount = parseFloat(payment_amount).toFixed(2);

    // check if collection exists
    const collection = await Collection.findOne({ where: { id: payment_collection_id } });
    if (!collection) {
        const error = new Error('Collection not found');
        error.statusCode = 404;
        throw error;
    }

    // check for existing payment using OR number
    const existingPayment = await Payment.findOne({ where: { payment_or_number } });
    if (existingPayment) {
        const error = new Error('Payment with this OR number already exists.');
        error.statusCode = 409;
        throw error;
    }

    // create new payment
    const newPayment = await Payment.create({
        payment_collection_id,
        payment_invoice_number: collection.collection_invoice_number,
        payment_or_number,
        payment_amount: amount,
        payment_mode,
        payment_remarks,
        payment_date: new Date(),
    });

    // just in case partial payment is made
    let partialPayment = 0;

    // handle additional data based on payment mode
    switch (payment_mode) {
        case 'cash':
            // nothing extra needed
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

    // update the collection status based on payment amount
    if (collection.collection_amount > amount) {
        partialPayment = amount;
        const newCollectionAmount = (collection.collection_amount || 0) - amount;

        await Collection.update(
            { collection_amount: newCollectionAmount },
            { where: { id: payment_collection_id } }
        )
    } else {
        await Collection.update(
            { collection_status: 'paid' },
            { where: { id: payment_collection_id } }
        );
    }

    // clear caches
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
                                attributes: ['client_department_name']
                            }
                        ]
                    }
                ]
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


// delete payment by ID service
exports.deletePaymentByIdService = async (paymentId) => {
    // validate payment ID
    validatePaymentId(paymentId);

    // fetch the existing payment
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
        const error = new Error('Payment not found');
        error.statusCode = 404; // Not Found
        throw error;
    }

    // update the collection status to 'pending' before deletion
    await Collection.update(
        { collection_status: 'pending' },
        { where: { id: payment.payment_collection_id } }
    );

    // delete the payment
    await payment.destroy();

    // clear cache for payments
    await clearPaymentsCache();

    return { message: 'Payment deleted successfully' };
};