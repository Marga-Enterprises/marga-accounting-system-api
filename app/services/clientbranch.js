// models and sequelize imports
const { Client, ClientBranch } = require('@models');
const { Op } = require('sequelize');

// validator functions
const {
    validateClientBranchFields,
    validateListClientBranchesParams,
    validateClientId,
    validateClientBranchId,
} = require('@validators/clientbranch');

// utility redis client
const { clearClientBranchesCache } = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');


// Create a new client branch service
exports.createClientBranchService = async (data) => {
    const { client_branch_name, client_branch_client_id, client_branch_address } = data;

    // validate the input data
    validateClientBranchFields(data);

    // validate the client ID
    validateClientId(client_branch_client_id);

    // check if parent client exists
    const clientExists = await Client.findByPk(client_branch_client_id);
    if (!clientExists) {
        const error = new Error('Client does not exist.');
        error.status = 400;
        throw error;
    }

    // check if a branch with the same name already exists for the given client
    const existingBranch = await ClientBranch.findOne({
        where: {
            client_branch_name,
            client_branch_client_id
        }
    });

    // if branch name already exists for the client, throw a 409 conflict error
    if (existingBranch) {
        const error = new Error('Client Branch with this name already exists for the specified client.');
        error.status = 409;
        throw error;
    }

    // create a new client branch instance
    const newClientBranch = await ClientBranch.create({
        client_branch_name,
        client_branch_client_id,
        client_branch_address
    });

    // clear the client branches cache
    await clearClientBranchesCache();

    // return the saved client branch data
    return newClientBranch;
};


// Get all client branches service
exports.getAllClientBranchesService = async (query) => {
    // validate the query parameters
    validateListClientBranchesParams(query);

    // get the query parameters
    let { pageIndex, pageSize, search, clientId } = query;

    // set default values for pagination
    pageIndex = parseInt(pageIndex);
    pageSize = parseInt(pageSize);

    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // check if clients are cached in Redis
    const cacheKey = `client_branches:page:${pageIndex}:${pageSize}:search:${search || ''}:clientId:${clientId || ''}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
        // return cached client branches if available
        return JSON.parse(cachedData);
    }

    // build the where clause for search functionality
    const whereClause = search ? {
        client_branch_name: {
            [Op.like]: `%${search}%`,
        },
        client_branch_client_id: clientId ? clientId : undefined
    } : {};

    // fetch client branches with pagination and search
    const { count, rows } = await ClientBranch.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [['createdAt', 'DESC']]
    });

    // calculate total pages
    const totalPages = Math.ceil(count / pageSize);

    // prepare the response object
    const response = {
        totalRecords: count,
        totalPages,
        pageIndex,
        pageSize,
        branches: rows
    };

    // cache the result in Redis
    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600); // cache for 1 hour

    // clear the client branches cache
    await clearClientBranchesCache();

    return response;
};


// Get client branch by ID service
exports.getClientBranchByIdService = async (id) => {
    // validate the client branch ID
    validateClientBranchId(id);

    // fetch the client branch by ID
    const clientBranch = await ClientBranch.findByPk(id);

    // if no client branch found, throw a 404 not found error
    if (!clientBranch) {
        const error = new Error('Client Branch not found.');
        error.status = 404;
        throw error;
    }

    // return the found client branch data
    return clientBranch;
};

