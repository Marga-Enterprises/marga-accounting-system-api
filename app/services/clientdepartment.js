// models and sequelize imports
const { Client, ClientDepartment } = require('@models');
const { Op } = require('sequelize');

// validator functions
const {
    validateClientDepartmentFields,
    validateListClientDepartmentsParams,
    validateClientId,
    validateClientDepartmentName,
    validateClientDepartmentId,
} = require('@validators/clientdepartment');

// utility redis client
const { clearClientDepartmentsCache } = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');


// Create a new client department service
exports.createClientDepartmentService = async (data) => {
    const { client_department_name, client_department_client_id, client_department_address, client_department_phone, client_department_email } = data;

    // validate the input data
    validateClientDepartmentFields(data);

    // validate the client ID
    validateClientId(client_department_client_id);

    // check if parent client exists
    const clientExists = await Client.findByPk(client_department_client_id);
    if (!clientExists) {
        const error = new Error('Client does not exist.');
        error.status = 400;
        throw error;
    }

    // check if a department with the same name already exists for the given client
    const existingDepartment = await ClientDepartment.findOne({
        where: {
            client_department_name,
            client_department_client_id
        }
    });

    // if department name already exists for the client, throw a 409 conflict error
    if (existingDepartment) {
        const error = new Error('Client Department with this name already exists for the specified client.');
        error.status = 409;
        throw error;
    }

    // create a new client department instance
    const newClientDepartment = await ClientDepartment.create({
        client_department_name,
        client_department_client_id,
        client_department_address,
        client_department_phone,
        client_department_email
    });

    // clear the client departments cache
    await clearClientDepartmentsCache();

    // return the saved department data
    return newClientDepartment;
};


// Get all client departments service
exports.getAllClientDepartmentsService = async (query) => {
    // validate the query parameters
    validateListClientDepartmentsParams(query);

    // get the query parameters
    let { pageIndex, pageSize, search, clientId } = query;

    // set default values for pagination
    pageIndex = parseInt(pageIndex);
    pageSize = parseInt(pageSize);

    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // check if the clients are cached in Redis
    const cacheKey = `client_departments:page:${pageIndex}:${pageSize}:search:${search || ''}:clientId:${clientId || ''}`;
    const cachedClientDepartments = await redisClient.get(cacheKey);

    if (cachedClientDepartments) {
        // return cached clients if available
        return JSON.parse(cachedClientDepartments);
    }

    // where clause for filtering
    let whereClause = {};

    if (search) {
        whereClause.client_department_name = {
            [Op.like]: `%${search}%`,
        };
    }

    if (clientId) {
        whereClause.client_department_client_id = clientId;
    }

    // fetch client departments with pagination and search
    const { count, rows } = await ClientDepartment.findAndCountAll({
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
        departments: rows
    };

    // cache the result in Redis
    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600); // cache for 1 hour

    // clear the client departments cache
    await clearClientDepartmentsCache();

    return response;
};


// Get client department by ID service
exports.getClientDepartmentByIdService = async (id) => {
    // validate the client department ID
    validateClientDepartmentId(id);

    // check if the client department is cached in Redis
    const cacheKey = `client_department:${id}`;
    const cachedClientDepartment = await redisClient.get(cacheKey);

    if (cachedClientDepartment) {
        // return cached client department if available
        return JSON.parse(cachedClientDepartment);
    }

    // fetch the client department by ID
    const clientDepartment = await ClientDepartment.findByPk(id);

    // if not found, throw a 404 not found error
    if (!clientDepartment) {
        const error = new Error('Client Department not found.');
        error.status = 404;
        throw error;
    }

    // cache the client department in Redis
    await redisClient.set(cacheKey, JSON.stringify(clientDepartment), 'EX', 3600); // cache for 1 hour

    return clientDepartment;
};


// Get client department by name service
exports.getClientByNameService = async (name) => {
    // validate the client department name
    validateClientDepartmentName(name);

    // check if the client department is cached in Redis
    const cacheKey = `client_department:${name}`;
    const cachedClientDepartment = await redisClient.get(cacheKey);

    if (cachedClientDepartment) {
        // return cached client department if available
        return JSON.parse(cachedClientDepartment);
    }

    // fetch the client department by name
    const clientDepartment = await ClientDepartment.findOne({
        where: {
            client_department_name: {
                [Op.like]: `%${name}%`
            }
        }
    });

    // if not found, throw a 404 not found error
    if (!clientDepartment) {
        const error = new Error('Client Department not found.');
        error.status = 404;
        throw error;
    }

    // cache the client department in Redis
    await redisClient.set(cacheKey, JSON.stringify(clientDepartment), 'EX', 3600); // cache for 1 hour
    
    return clientDepartment;
};


// Update client department by ID service
exports.updateClientDepartmentService = async (id, data) => {
    // validate the client department ID
    validateClientDepartmentId(id);

    // validate the input data
    validateClientDepartmentFields(data);

    // fetch the existing client department by ID
    const existingDepartment = await ClientDepartment.findByPk(id);

    // if not found, throw a 404 not found error
    if (!existingDepartment) {
        const error = new Error('Client Department not found.');
        error.status = 404;
        throw error;
    }

    // check if the parent client exists
    const clientExists = await Client.findByPk(data.client_department_client_id);
    if (!clientExists) {
        const error = new Error('Parent Client does not exist.');
        error.status = 400;
        throw error;
    }

    // update the client department with new data
    const updatedDepartment = await existingDepartment.update(data);

    // clear the client departments cache
    await clearClientDepartmentsCache();

    return updatedDepartment;
};  


// Delete client department by ID service
exports.deleteClientDepartmentService = async (id) => {
    // validate the client department ID
    validateClientDepartmentId(id);

    // fetch the existing client department by ID
    const existingDepartment = await ClientDepartment.findByPk(id);

    // if not found, throw a 404 not found error
    if (!existingDepartment) {
        const error = new Error('Client Department not found.');
        error.status = 404;
        throw error;
    }

    // delete the client department
    await existingDepartment.destroy();

    // clear the client departments cache
    await clearClientDepartmentsCache();

    return { message: 'Client Department deleted successfully.' };
};