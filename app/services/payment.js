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
    let { pageIndex, pageSize, search, type, startDate, endDate } = params;

    // set default values for pagination
    pageIndex = parseInt(pageIndex) || 0;
    pageSize = parseInt(pageSize) || 10;
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // redis cache key
    const cacheKey = `payments:page:${pageIndex}:${pageSize}:${search || ''}:${type || ''}:${startDate || ''}:${endDate || ''}`;
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
            : {}),
        ...(startDate && endDate
            ? {
                payment_collection_date: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                }
            : {}),
    };


    // fetch payments with associated collection and client department
    const { count, rows } = await Payment.findAndCountAll({
        where: whereClause,
        order: [
            ['payment_is_cancelled', 'ASC'], 
            ['createdAt', 'DESC']           
        ],
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


//  update payment service
exports.updatePaymentByIdService = async (paymentId, data) => {
    // Destructure fields from data
    const {
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
        payment_pdc_deposit_date,
        payment_pdc_credit_date,
        payment_date,
        payment_posting_date,
        payment_collection_date,
        payment_client_tin
    } = data;

    // Validate payment ID format
    validatePaymentId(paymentId);

    const transaction = await sequelize.transaction();

    try {
        const payment = await Payment.findByPk(paymentId, { transaction });
        if (!payment) {
            const error = new Error('Payment not found');
            error.statusCode = 404;
            throw error;
        }

        const collection = await Collection.findByPk(payment.payment_collection_id, {
            include: [{
                model: Billing,
                as: 'billing',
                include: [{
                    model: ClientDepartment,
                    as: 'department',
                    include: [{
                        model: Client,
                        as: 'client',
                        attributes: ['id', 'client_tin']
                    }]
                }]
            }],
            transaction
        });

        if (!collection) {
            const error = new Error('Collection not found');
            error.statusCode = 404;
            throw error;
        }

        // Update client TIN if needed
        const client = collection.billing.department.client;
        if (payment_client_tin && client) {
            const existingTIN = client.client_tin?.trim() || '';
            const incomingTIN = payment_client_tin.trim();
            if (!existingTIN || existingTIN !== incomingTIN) {
                await Client.update({ client_tin: incomingTIN }, { where: { id: client.id }, transaction });
            }
        }

        const oldAmount = parseFloat(payment.payment_amount);
        const newAmount = parseFloat(payment_amount);
        const payment2307 = payment_2307_amount ? parseFloat(payment_2307_amount) : 0.00;
        const adjustedPaidAmount = newAmount - payment2307;

        // Update payment record
        await payment.update({
            payment_or_number,
            payment_invoice_number,
            payment_amount: newAmount,
            payment_amount_paid: adjustedPaidAmount,
            payment_2307_amount: payment2307,
            payment_has_2307,
            payment_mode,
            payment_remarks,
            payment_date,
            payment_posting_date,
            payment_collection_date,
        }, { transaction });

        // Handle sub-records update based on payment_mode
        switch (payment_mode) {
            case 'cheque':
                await PaymentCheque.upsert({
                    id: paymentId,
                    payment_cheque_number,
                    payment_cheque_date
                }, { transaction });
                break;

            case 'online_transfer':
                await PaymentOnlineTransfer.upsert({
                    id: paymentId,
                    payment_online_transfer_reference_number,
                    payment_online_transfer_date
                }, { transaction });
                break;

            case 'pdc':
                await PaymentPDC.upsert({
                    id: paymentId,
                    payment_pdc_number,
                    payment_pdc_date,
                    payment_pdc_deposit_date,
                    payment_pdc_credit_date
                }, { transaction });
                break;

            case 'cash':
                // Optional: Remove any existing sub-records for other modes
                await Promise.all([
                    PaymentCheque.destroy({ where: { id: paymentId }, transaction }),
                    PaymentOnlineTransfer.destroy({ where: { id: paymentId }, transaction }),
                    PaymentPDC.destroy({ where: { id: paymentId }, transaction })
                ]);
                break;

            default:
                throw Object.assign(new Error('Invalid payment mode'), { statusCode: 400 });
        }

        // Adjust collection balance if amount was changed
        if (oldAmount !== newAmount) {
            const currentBalance = parseFloat(collection.collection_balance);
            let newBalance = currentBalance + oldAmount - newAmount;

            const updatedStatus = newBalance < collection.collection_amount ? 'pending' : 'paid';
            newBalance = newBalance < 0 ? 0.00 : newBalance;

            await Collection.update({
                collection_balance: newBalance,
                collection_status: updatedStatus
            }, {
                where: { id: collection.id },
                transaction
            });
        }

        await transaction.commit();

        // Clear caches
        await clearPaymentsCache(paymentId);
        await clearCollectionsCache(collection.id);

        return { message: 'Payment updated successfully' };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};


// cancel payment service
exports.cancelPaymentService = async (paymentId) => {
    // Validate payment ID format
    validatePaymentId(paymentId);

    // Start a transaction
    const transaction = await sequelize.transaction();

    try {
        // Fetch payment
        const payment = await Payment.findByPk(paymentId, { transaction });
        if (!payment) {
            const error = new Error('Payment not found');
            error.statusCode = 404;
            throw error;
        }

        // Fetch collection
        const collection = await Collection.findByPk(payment.payment_collection_id, { transaction });
        if (!collection) {
            const error = new Error('Collection not found');
            error.statusCode = 404;
            throw error;
        }

        // Cancel the payment
        await payment.update({ payment_is_cancelled: true }, { transaction });

        const paymentAmount = parseFloat(payment.payment_amount);
        const collectionBalance = parseFloat(collection.collection_balance);
        const collectionAmount = parseFloat(collection.collection_amount);

        // Compute new balance
        const newBalance = collectionBalance + paymentAmount;

        const updatedFields = {
            collection_balance: newBalance > collectionAmount ? collectionAmount : newBalance,
            collection_status: newBalance < collectionAmount ? 'pending' : 'paid'
        };

        // Update the collection
        await Collection.update(
            updatedFields,
            { where: { id: collection.id }, transaction }
        );

        // Commit the transaction
        await transaction.commit();

        // Clear caches
        await clearPaymentsCache(paymentId);
        await clearCollectionsCache(collection.id);

        return { message: 'Payment cancelled successfully' };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

