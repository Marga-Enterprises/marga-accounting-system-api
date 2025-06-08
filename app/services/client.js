// models and sequelize imports
const { Client, ClientDepartment, ClientBranch } = require('@models');
const { Op } = require('sequelize');

// validator functions
const {
    validateClientFields,
    validateListClientsParams,
    validateClientId,
} = require('@validators/client');

// utility redis client
const { clearClientsCache } = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');


// Create a new client service
exports.createClientService = async (data) => {
    const { client_name, client_description } = data;

    // validate the input data
    validateClientFields(data);

    // check if a client with the same name already exists
    const existingClient = await Client.findOne({ where: { client_name } });

    // if Client Name already exists, throw a 409 conflict error
    if (existingClient) {
        const error = new Error('Client with this name already exists.');
        error.status = 409;
        throw error;
    }

    // create a new client instance
    const newClient = await Client.create({
        client_name,
        client_description
    });

    // clear the client cache
    await clearClientsCache();

    // return the saved client data
    return newClient;
};


// Get all clients service
exports.getAllClientsService = async (query) => {
    // validate the query parameters
    validateListClientsParams(query);

    // get the query parameters
    let { pageIndex, pageSize, search } = query;

    // set default values for pagination
    pageIndex = parseInt(pageIndex);
    pageSize = parseInt(pageSize);

    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // check if the clients are cached in Redis
    const cacheKey = `clients:page:${pageIndex}:${pageSize}:search:${search || ''}`;
    const cachedClients = await redisClient.get(cacheKey);

    if (cachedClients) {
        // return cached clients if available
        return JSON.parse(cachedClients);
    }

    // build the where clause for searching
    const whereClause = search ? {
        client_name: {
            [Op.like]: `%${search}%`
        }
    } : {};

    // fetch clients from the database with pagination and search
    const clients = await Client.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [['createdAt', 'DESC']]
    });

    // cache the result in Redis
    await redisClient.set(cacheKey, JSON.stringify(clients), 'EX', 3600); // cache for 1 hour

    return clients;
};


// Get client by ID service
exports.getClientByIdService = async (id) => {
    // validate the client ID
    validateClientId(id);

    // check if the client is cached in Redis
    const cacheKey = `client:${id}`;
    const cachedClient = await redisClient.get(cacheKey);

    if (cachedClient) {
        // return cached client if available
        return JSON.parse(cachedClient);
    }

    // fetch the client from the database
    const client = await Client.findByPk(id, {
        include: [
            {
                model: ClientBranch,
                as: 'branches',
                required: false, 
            },
            {
                model: ClientDepartment,
                as: 'departments',
                required: false, 
            }
        ]
    });

    if (!client) {
        throw new Error('Client not found');
    }

    // cache the client data in Redis
    await redisClient.set(cacheKey, JSON.stringify(client), 'EX', 3600); // cache for 1 hour

    return client;
};


// Update a client service
exports.updateClientService = async (id, data) => {
    // validate the ID
    validateClientId(id);

    // validate the input data
    validateClientFields(data);

    // check if the client exists
    const client = await Client.findByPk(id);

    if (!client) {
        throw new Error('Client not found');
    }

    // update the client with new data
    await client.update(data);

    // clear the client cache
    await clearClientsCache(id);

    return client;
};


// Delete a client service
exports.deleteClientService = async (id) => {
    // validate the ID
    validateClientId(id);

    // check if the client exists
    const client = await Client.findByPk(id);

    if (!client) {
        throw new Error('Client not found');
    }

    // delete the client
    await client.destroy();

    // clear the client cache
    await clearClientsCache(id);

    return { message: 'Client deleted successfully' };
};