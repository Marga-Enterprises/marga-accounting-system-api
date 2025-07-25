// models and sequelize imports
const { Billing, ClientDepartment, CancelledInvoice, Collection } = require('@models');
const { Op, Sequelize } = require('sequelize');

// validator functions
const {
    validateBillingFields,
    validateListBillingsParams,
    validateBillingId,
} = require('@validators/billing');

// utility redis client
const { 
    clearBillingsCache,
    clearCollectionsCache 
} = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');
const { raw } = require('mysql2');


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

    // validate input
    // validateBillingFields(data);

    // check for existing billing by invoice number
    const existingBilling = await Billing.findOne({ where: { billing_invoice_number } });

    if (existingBilling) {
        if (existingBilling.billing_is_cancelled) {
            // If it exists and is cancelled, update and "revive" it
            await existingBilling.update({
                billing_client_id,
                billing_department_id,
                billing_amount,
                billing_total_amount,
                billing_vat_amount,
                billing_discount,
                billing_month,
                billing_year,
                billing_type,
                billing_is_cancelled: false,
            });

            await clearBillingsCache(existingBilling.id);
            return existingBilling;
        } else {
            // Exists and is active — conflict
            const error = new Error('Billing with this invoice number already exists.');
            error.status = 409;
            throw error;
        }
    }

    // client department check
    const clientDepartment = await ClientDepartment.findByPk(billing_department_id);
    if (!clientDepartment) {
        const error = new Error('Client department not found.');
        error.status = 404;
        throw error;
    }

    // create new billing
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

    // create collection as well
    const newCollection = await Collection.create({
        collection_billing_id: newBilling.id,
        collection_invoice_number: newBilling.billing_invoice_number,
        collection_amount: newBilling.billing_total_amount,
        collection_date: new Date(), 
        collection_remarks: '' 
    })

    await clearBillingsCache();

    const response = {
        billing: newBilling,
        collection: newCollection
    };

    return response;
};


// service to bulk create billings
exports.createBulkBillingsService = async (data) => {
    const bulkDataArray = Object.values(data);

    // validate input
    if (!Array.isArray(bulkDataArray) || bulkDataArray.length === 0) {
        const error = new Error('Invalid input data for bulk billing creation.');
        error.status = 400;
        throw error;
    }

    // validate each billing entry
    /*data.forEach(billing => {
        validateBillingFields(billing);
    });*/

    // check for existing billings by invoice number
    const existingBillings = await Billing.findAll({
        where: {
            billing_invoice_number: bulkDataArray.map(b => b.billing_invoice_number)
        }
    });

    if (existingBillings.length > 0) {
        const existingInvoiceNumbers = existingBillings.map(b => b.billing_invoice_number);
        const error = new Error(`Billings with invoice numbers ${existingInvoiceNumbers.join(', ')} already exist.`);
        error.status = 409;
        throw error;
    };

    // get the ids of client departments from billing_client_department_name
    const clientDepartmentIds = await ClientDepartment.findAll({
        where: {
            client_department_name: [...new Set(bulkDataArray.map(b => b.billing_client_department_name))]
        },
        attributes: [
            'client_department_name',
            'id',
            'client_department_client_id'
        ],
        group: ['client_department_name'],
        raw: true
    });

    // loop through the client departments and map them to their ids
    const clientDepartmentMap = {};

    const normalize = (str) => {
        return str
            ?.replace(/[\r\n\u00A0\u200B]/g, '')
            .replace(/\s+/g, ' ')               
            .trim()                             
            .toLowerCase();                     
        };

    for (const dept of clientDepartmentIds) {
        clientDepartmentMap[normalize(dept.client_department_name)] = dept;
    }

    // create billings in bulk and saving the department ids
    const newBillings = await Billing.bulkCreate(
        bulkDataArray.map(billing => {
            const match = clientDepartmentMap[normalize(billing.billing_client_department_name)];

            return {
                ...billing,
                billing_department_id: match?.id || null,
                billing_client_id: match?.client_department_client_id || null
            };
        })
    );

    // create collections for each billing
    const newCollections = await Collection.bulkCreate(newBillings.map(billing => ({
        collection_billing_id: billing.id,
        collection_invoice_number: billing.billing_invoice_number,
        collection_amount: billing.billing_total_amount,
        collection_date: new Date(), // current date
        collection_remarks: '' // default remarks
    })));

    // clear the billings cache
    await clearBillingsCache();

    // clear the collections cache
    await clearCollectionsCache();

    const response = {
        billings: newBillings,
        collections: newCollections
    };
    
    return response;
};


// service to get all billings
exports.getAllBillingsService = async (query) => {
    // validate query params
    validateListBillingsParams(query);

    let { pageIndex, pageSize, billingMonth, billingYear, search, category } = query;

    pageIndex = parseInt(pageIndex);
    pageSize = parseInt(pageSize);
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // create cache key
    const cacheKey = `billings:page:${pageIndex}:${pageSize}:search:${search || ''}:category:${category || ''}:month:${billingMonth || ''}:year:${billingYear || ''}`
    const cachedBillings = await redisClient.get(cacheKey);
    if (cachedBillings) {
        return JSON.parse(cachedBillings);
    }

    // build the where clause
    const whereClause = {
        billing_is_cancelled: false,
        ...(category && !search ? { billing_type: category } : {}),
        ...(billingMonth && !search ? { billing_month: billingMonth } : {}),
        ...(billingYear && !search ? { billing_year: billingYear } : {}),
        ...(search
            ? { billing_invoice_number: { [Op.like]: `%${search}%` } }
            : {}),
    };

    // total for the month result
    const totalForMonthResult = await Billing.findOne({
        where: whereClause,
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('billing_total_amount')), 'total_billing_amount'],
        ],
        raw: true,
    });

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


    const totalBillingForMonth= parseFloat(totalForMonthResult.total_billing_amount || 0);
    const totalPages = Math.ceil(count / pageSize);

    const response = {
        pageIndex,
        pageSize,
        totalPages,
        totalRecords: count,
        totalBillingForMonth,
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

    // delete collection
    const collection = await Collection.findOne({
        where: {cancelledInvoiceId: billing.id}
    });

    if (collection) {
        await collection.destroy();
        await clearCollectionsCache();
    }

    // delete the original billing record
    // await billing.destroy();

    // clear the billing cache
    await clearBillingsCache(billingId);

    return cancelledInvoice;
};