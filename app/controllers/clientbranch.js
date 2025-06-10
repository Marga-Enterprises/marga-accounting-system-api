// utilities
const {
    getToken,
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services
const {
    createClientBranchService,
    getAllClientBranchesService,
    getClientBranchByIdService,
    updateClientBranchService,
    deleteClientBranchService
} = require('@services/clientbranch');


// Create a new client branch
exports.create = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to create a new client branch
        const result = await createClientBranchService(req.body);

        // send response with the created client branch data
        return sendSuccess(res, result, 'Client Branch created successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Get all client branches
exports.list = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get all client branches
        const result = await getAllClientBranchesService(req.query);

        // send response with the list of client branches
        return sendSuccess(res, result, 'Client Branches retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Get client branch by ID
exports.getById = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get client branch by ID
        const result = await getClientBranchByIdService(req.params.clientBranchId);

        // send response with the client branch data
        return sendSuccess(res, result, 'Client Branch retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Update client branch by ID
exports.update = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to update client branch by ID
        const result = await updateClientBranchService(req.params.clientBranchId, req.body);

        // send response with the updated client branch data
        return sendSuccess(res, result, 'Client Branch updated successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Delete client branch by ID
exports.delete = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to delete client branch by ID
        const result = await deleteClientBranchService(req.params.clientBranchId);

        // send response indicating successful deletion
        return sendSuccess(res, result, 'Client Branch deleted successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};