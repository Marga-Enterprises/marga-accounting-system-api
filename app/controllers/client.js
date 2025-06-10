// utilities
const { 
    getToken, 
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services
const { 
    createClientService, 
    getAllClientsService, 
    getClientByIdService, 
    updateClientService, 
    deleteClientService 
} = require('@services/client');


// create a new client
exports.create = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to create a new client
        const result = await createClientService(req.body);

        // send response with the created client data
        return sendSuccess(res, result, 'Client created successfully.');
    } catch (error) {
        console.error('Error creating client:', error);
        return sendError(res, '', error.message, error.status);
    }
};


// get all clients
exports.list = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get all clients
        const result = await getAllClientsService(req.query);

        // send response with the list of clients
        return sendSuccess(res, result, 'Clients retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// get client by ID
exports.getById = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get client by ID
        const result = await getClientByIdService(req.params.clientId);

        // send response with the client data
        return sendSuccess(res, result, 'Client retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// update client by ID
exports.update = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to update client by ID
        const result = await updateClientService(req.params.clientId, req.body);

        // send response with the updated client data
        return sendSuccess(res, result, 'Client updated successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// delete client by ID
exports.delete = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to delete client by ID
        const result = await deleteClientService(req.params.clientId);

        // send response with the deletion status
        return sendSuccess(res, result, 'Client deleted successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};



