// models and sequelize imports
const { Billing, ClientDepartment, CancelledInvoice } = require('@models');
const { Op } = require('sequelize');

// validator functions
const {
    validateBillingFields,
    validateListBillingsParams,
    validateBillingId,
} = require('@validators/billing');

// utility redis client
const { clearBillingsCache } = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');


// service to create a new billing
exports.createBillingService = async (data) => {
    const {
        billing_client_id,
        billing_department_id,
        billing_invoice_number,
        billing_amount,
        billing_total_amount,
        billing_vat_amount,
        billing_discount,
        billing_month,
        billing_year,
        billing_type
    } = data;

    // validate the input data
    validateBillingFields(data);

    // check if a billing with the same invoice number already exists
    const existingBilling = await Billing.findOne({ where: { billing_invoice_number } });

    // if Billing Invoice Number already exists, throw a 409 conflict error
    if (existingBilling) {
        const error = new Error('Billing with this invoice number already exists.');
        error.status = 409;
        throw error;
    };

    // check if the client department exists
    const clientDepartment = await ClientDepartment.findByPk(billing_department_id);

    if (!clientDepartment) {
        const error = new Error('Client department not found.');
        error.status = 404;
        throw error;
    };

    // create a new billing instance
    const newBilling = await Billing.create({
        billing_invoice_number,
        billing_amount,
        billing_total_amount,
        billing_vat_amount,
        billing_discount,
        billing_month,
        billing_year,
        billing_type,
        billing_department_id,
        billing_client_id,
    });

    // clear the billing cache
    await clearBillingsCache();

    // return the saved billing data
    return newBilling;
};


// service to get all billings
exports.getAllBillingsService = async (query) => {
    // validate the query parameters
    validateListBillingsParams(query);

    let { pageIndex, pageSize, billingMonth, billingYear, search } = query;

    pageIndex = parseInt(pageIndex);
    pageSize = parseInt(pageSize);
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // cache key
    const cacheKey = `billings:page:${pageIndex}:size:${pageSize}:search:${search || ''}:month:${billingMonth}:year:${billingYear}`;
    const cachedBillings = await redisClient.get(cacheKey);
    if (cachedBillings) {
        return JSON.parse(cachedBillings);
    }

    // Get all cancelled invoice numbers
    const cancelledInvoices = await CancelledInvoice.findAll({
        attributes: ['cancelled_invoice_number'],
    });

    const cancelledNumbers = cancelledInvoices.map(ci => ci.cancelled_invoice_number);

    // build the where clause
    const whereClause = {
        ...(billingMonth ? { billing_month: billingMonth } : {}),
        ...(billingYear ? { billing_year: billingYear } : {}),
        ...(search
            ? { billing_invoice_number: { [Op.like]: `%${search}%` } }
            : {}),
        billing_invoice_number: {
            [Op.notIn]: cancelledNumbers, // 🚫 exclude cancelled
        },
    };

    const { count, rows } = await Billing.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        include: [
            {
                model: ClientDepartment,
                as: 'department',
                required: false,
                attributes: ['client_department_name'],
            },
        ],
        order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / pageSize);

    const response = {
        pageIndex,
        pageSize,
        totalPages,
        totalRecords: count,
        billings: rows,
    };

    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600);

    return response;
};


// service to get billing by ID
exports.getBillingByIdService = async (billingId) => {
    // validate the billing ID
    validateBillingId(billingId);

    // check if the billing is cached in Redis
    const cacheKey = `billing:${billingId}`;
    const cachedBilling = await redisClient.get(cacheKey);

    if (cachedBilling) {
        // return cached billing if available
        return JSON.parse(cachedBilling);
    };

    // fetch the billing from the database
    const billing = await Billing.findByPk(billingId, {
        include: [
            {
                model: ClientDepartment,
                as: 'department',
                required: false,
                attributes: ['client_department_name']
            }
        ]
    });

    // if billing not found, throw a 404 error
    if (!billing) {
        const error = new Error('Billing not found.');
        error.status = 404;
        throw error;
    };

    // cache the billing data in Redis
    await redisClient.set(cacheKey, JSON.stringify(billing), 'EX', 3600); // cache for 1 hour

    return billing;
}


// service to update billing by ID
exports.updateBillingService = async (billingId, data) => {
    // validate the billing ID
    validateBillingId(billingId);

    // validate the input data
    validateBillingFields(data);

    // check if the billing exists
    const billing = await Billing.findByPk(billingId);

    if (!billing) {
        const error = new Error('Billing not found.');
        error.status = 404;
        throw error;
    };

    // update the billing with the new data
    await billing.update(data);

    // clear the billing cache
    await clearBillingsCache(billingId);

    return billing;
};


// service to delete billing by ID
exports.deleteBillingService = async (billingId) => {
    // validate the billing ID
    validateBillingId(billingId);

    // check if the billing exists
    const billing = await Billing.findByPk(billingId);

    if (!billing) {
        const error = new Error('Billing not found.');
        error.status = 404;
        throw error;
    };

    // delete the billing
    await billing.destroy();

    // clear the billing cache
    await clearBillingsCache(billingId);

    return { message: 'Billing deleted successfully.' };
};


// service to cancel billing by ID
exports.cancelBillingService = async (billingId, data) => {
    // validate the billing ID
    validateBillingId(billingId);

    // check if the billing exists
    const billing = await Billing.findByPk(billingId);

    if (!billing) {
        const error = new Error('Billing not found.');
        error.status = 404;
        throw error;
    };

    // create a new cancelled invoice record
    const cancelledInvoice = await CancelledInvoice.create({
        cancelled_invoice_number: billing.billing_invoice_number,
        cancelled_invoice_amount: billing.billing_total_amount,
        cancelled_invoice_remarks: data.remarks || 'Cancelled by user',
        cancelled_invoice_billing_id: billing.id
    });

    // delete the original billing record
    // await billing.destroy();

    // clear the billing cache
    await clearBillingsCache(billingId);

    return cancelledInvoice;
};