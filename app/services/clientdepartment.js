// models and sequelize imports
const { Client, ClientDepartment } = require('@models');
const { Op } = require('sequelize');

// validator functions
const {
    validateClientDepartmentFields,
    validateListClientDepartmentsParams,
    validateClientId,
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

    // build the where clause for search functionality
    const whereClause = search ? {
        client_name: {
            [Op.like]: `%${search}%`,
        },
        client_branch_client_id: clientId ? clientId : undefined
    } : {};

    // fetch client departments with pagination and search
    const clientDepartments = await ClientDepartment.findAndCountAll({
        where: whereClause,
        offset: pageIndex * pageSize,
        limit: pageSize,
        order: [['createdAt', 'DESC']]
    });

    // clear the client departments cache
    await clearClientDepartmentsCache();

    return clientDepartments;
};


// Get client department by ID service
exports.getClientDepartmentByIdService = async (id) => {
    // validate the client department ID
    validateClientDepartmentId(id);

    // fetch the client department by ID
    const clientDepartment = await ClientDepartment.findByPk(id);

    // if not found, throw a 404 not found error
    if (!clientDepartment) {
        const error = new Error('Client Department not found.');
        error.status = 404;
        throw error;
    }

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