// models and sequelize imports
const { Collection, Billing, ClientDepartment, Client } = require('@models');
const { Op, Sequelize } = require('sequelize');

// dayjs for date manipulation
const dayjs = require('dayjs');

// validator functions
const {
    validateCreateCollectionFields,
    validateListCollectionsParams,
    validateCollectionId,
} = require('@validators/collection');

// utility redis client
const { clearCollectionsCache } = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');


// create collection service
exports.createCollectionService = async (data) => {
    const {
        collection_billing_id,
        collection_invoice_number,
        collection_amount,
        collection_status,
        collection_date,
        collection_remarks
    } = data;

    // validate the input data
    validateCreateCollectionFields(data);

    // create a new collection instance
    const newCollection = await Collection.create({
        collection_billing_id,
        collection_invoice_number,
        collection_amount,
        collection_status,
        collection_date: new Date(collection_date),
        collection_remarks
    });

    // clear the collections cache
    await clearCollectionsCache();

    // return the saved collection data
    return newCollection;
};


// Get all collections service
exports.getAllCollectionsService = async (query) => {
    // Validate query parameters
    validateListCollectionsParams(query);

    // Extract and normalize query params
    let { pageIndex, pageSize, search, status, dateRange } = query;
    const today = dayjs();

    pageIndex = parseInt(pageIndex);
    pageSize = parseInt(pageSize);
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // Redis cache key
    const cacheKey = `collections:page:${pageIndex}:${pageSize}:search:${search || ''}:status:${status || ''}:range:${dateRange || ''}`;
    const cachedCollections = await redisClient.get(cacheKey);
    if (cachedCollections) return JSON.parse(cachedCollections);

    // Build dynamic where clause
    const whereClause = {};

    if (status) {
        whereClause.collection_status = status;
    }

    // filter by collection date range
    if (dateRange) {
        // Only force status to 'pending' if status is not explicitly set
        if (!status) {
            whereClause.collection_status = 'pending';
        }

        // Build date range
        if (dateRange === '1-29') {
            whereClause.collection_date = {
                [Op.between]: [
                    today.subtract(29, 'day').startOf('day').toDate(),
                    today.endOf('day').toDate()
                ]
            };
        } else if (dateRange === '30-59') {
            whereClause.collection_date = {
                [Op.between]: [
                    today.subtract(59, 'day').startOf('day').toDate(),
                    today.subtract(30, 'day').endOf('day').toDate()
                ]
            };
        } else if (dateRange === '60-89') {
            whereClause.collection_date = {
                [Op.between]: [
                    today.subtract(89, 'day').startOf('day').toDate(),
                    today.subtract(60, 'day').endOf('day').toDate()
                ]
            };
        } else if (dateRange === '90-119') {
            whereClause.collection_date = {
                [Op.between]: [
                    today.subtract(119, 'day').startOf('day').toDate(),
                    today.subtract(90, 'day').endOf('day').toDate()
                ]
            };
        } else if (dateRange === '120') {
            whereClause.collection_date = {
                [Op.lte]: today.subtract(120, 'day').endOf('day').toDate()
            };
        }
    }

    // Add search condition (across local + foreign fields)
    if (search) {
        whereClause[Op.or] = [
            { collection_invoice_number: { [Op.like]: `%${search}%` } },
            { '$billing.department.client_department_name$': { [Op.like]: `%${search}%` } }
        ];
    }

    // fetch total collection amount
    const collectionTotalAmount = await Collection.findOne({
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('collection_amount')), 'totalAmount']
        ],
        where: whereClause,
        include: [
            {
                model: Billing,
                as: 'billing',
                required: true,
                attributes: [], // ✅ prevent GROUP BY issue
                include: [
                    {
                        model: ClientDepartment,
                        as: 'department',
                        required: true,
                        attributes: [] // ✅ prevent GROUP BY issue
                    }
                ]
            }
        ],
        raw: true,
        subQuery: false
    });

    // Fetch from DB
    const { count, rows } = await Collection.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: Billing,
                as: 'billing',
                required: true,
                attributes: [
                    'id',
                    'billing_invoice_number',
                    'billing_total_amount',
                    'billing_department_id',
                    'billing_type'
                ],
                include: [
                    {
                        model: ClientDepartment,
                        as: 'department',
                        attributes: ['client_department_name', 'client_department_address'],
                        include: [
                            {
                                model: Client,
                                as: 'client',
                                attributes: ['client_name', 'client_tin']
                            }
                        ],
                        required: true
                    }
                ]
            }
        ],
        offset,
        limit,
        order: [
            [Sequelize.col('billing.department.client_department_name'), 'ASC'],
        ],
        subQuery: false
    });

    const totalPages = Math.ceil(count / pageSize);

    // ensure collectionTotalAmount is parsed correctly
    const totalCollectionAmount = parseFloat(collectionTotalAmount.totalAmount || 0);

    const response = {
        pageIndex,
        pageSize,
        totalRecords: count,
        totalPages,
        totalCollectionAmount,
        collections: rows,
    };

    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600);
    return response;
};


// Get collection by ID service
exports.getCollectionByIdService = async (collectionId) => {
    // validate the collection ID
    validateCollectionId(collectionId);

    // create the cache key
    const cacheKey = `collection:${collectionId}`;
    const cachedCollection = await redisClient.get(cacheKey);

    if (cachedCollection) {
        // return cached collection if available
        return JSON.parse(cachedCollection);
    };

    // fetch the collection from the database
    const collection = await Collection.findByPk(collectionId, {
        include: [{
            model: Billing,
            as: 'billing',
            required: true,
        }],
    });

    if (!collection) {
        throw new Error('Collection not found');
    };

    // cache the collection data in Redis
    await redisClient.set(cacheKey, JSON.stringify(collection), 'EX', 3600);

    // return the collection data
    return collection;
}


// Update collection by ID service
exports.updateCollectionByIdService = async (collectionId, data) => {
    // validate the collection ID
    validateCollectionId(collectionId);

    // fetch the existing collection
    const collection = await Collection.findByPk(collectionId);

    if (!collection) {
        throw new Error('Collection not found');
    };

    // update the collection with new data
    await collection.update(data);

    // clear the collections cache
    await clearCollectionsCache(collectionId);

    // return the updated collection
    return collection;
};


// delete collection by ID service
exports.deleteCollectionByIdService = async (collectionId) => {
    // validate the collection ID
    validateCollectionId(collectionId);

    // fetch the existing collection
    const collection = await Collection.findyByPk(collectionId);

    if (!collection) {
        throw new Error('Collection not found');
    };

    // delete the collection
    await collection.destroy();

    // clear the collections cache
    await clearCollectionsCache();

    // return a success message
    return { message: 'Collection deleted successfully.' };
};