// models and sequelize imports
const { Billing, ClientDepartment } = require('@models');
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
        billing_branch_dept_name,
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
    const clientDepartment = await ClientDepartment.findOne({
        where: {
            client_department_name: billing_branch_dept_name,
        },
    });

    if (!clientDepartment) {
        const error = new Error('Client department not found.');
        error.status = 404;
        throw error;
    };

    // create a new billing instance
    const newBilling = await Billing.create({
        billing_branch_dept_name,
        billing_invoice_number,
        billing_amount,
        billing_total_amount,
        billing_vat_amount,
        billing_discount,
        billing_month,
        billing_year,
        billing_type,
        billing_department_id: clientDepartment.id,
        billing_client_id: clientDepartment.client_department_client_id,
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

    // get the query parameters
    let { pageIndex, pageSize, billing_month, billing_year, search } = query;

    // set default values for pagination
    pageIndex = parseInt(pageIndex);
    pageSize = parseInt(pageSize);

    // set the offset for pagination
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // check if the billings are cached in Redis
    const cacheKey = `billings:page:${pageIndex}:size:${pageSize}:search:${search || ''}:month:${billing_month}:year:${billing_year}`;
    const cachedBillings = await redisClient.get(cacheKey);

    if (cachedBillings) {
        // return cached billings if available
        return JSON.parse(cachedBillings);
    };

    // build the where clause for searching
    const whereClause = search
    ? {
        billing_invoice_number: {
            [Op.like]: `%${search}%`
        }
        }
    : {
        ...(billing_month && { billing_month }),
        ...(billing_year && { billing_year })
    };

    // fetch the billings from the database
    const { count, rows } = await Billing.findAndCountAll({
        where: whereClause,
        offset,
        include: [
            {
                model: ClientDepartment,
                as: 'department',
                required: false,
                attributes: ['client_department_name']
            }
        ],
        limit,
        order: [['createdAt', 'DESC']],
    });

    // calculate total pages
    const totalPages = Math.ceil(count / pageSize);

    // prepare the response object
    const response = {
        pageIndex,
        pageSize,
        totalPages,
        totalRecords: count,
        billings: rows
    };

    // cache the response in Redis
    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600); // cache for 1 hour

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
    const billing = await Billing.findByPk(billingId);

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