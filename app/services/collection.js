// models and sequelize imports
const { Collection, Billing } = require('@models');
const { Op, col } = require('sequelize');

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
    // validate the query parameters
    validateListCollectionsParams(query);

    // get the query parameters
    let { pageIndex, pageSize, search } = query;

    // set default values for pagination
    pageIndex = parseInt(pageIndex);
    pageSize = parseInt(pageSize);
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // check if the collections are cached in Redis
    const cacheKey = `collections:page:${pageIndex}:${pageSize}:search:${search || ''}`;
    const cachedCollections = await redisClient.get(cacheKey);

    if (cachedCollections) {
        // return cached collections if available
        return JSON.parse(cachedCollections);
    };

    // where for filtering collections
    const whereClause = search ? {
        collection_invoice_number: {
            [Op.like]: `%${search}%`
        }
    } : {};

    // fetch collections from the database
    const { count, rows  } = await Collection.findAndCountAll({
        whereClause,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
    });

    // calculate total pages
    const totalPages = Math.ceil(count / pageSize);

    // prepare the response object
    const response = {
        pageIndex,
        pageSize,
        totalRecords: count,
        totalPages,
        collections: rows,
    };

    // cache the collections data in Redis
    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600);

    // return the response
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