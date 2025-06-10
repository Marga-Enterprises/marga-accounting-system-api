// utilities
const {
    getToken,
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services
const {
    createClientDepartmentService,
    getAllClientDepartmentsService,
    getClientDepartmentByIdService,
    updateClientDepartmentService,
    deleteClientDepartmentService
} = require('@services/clientdepartment');


// Create a new client department
exports.create = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to create a new client department
        const result = await createClientDepartmentService(req.body);

        // send response with the created client department data
        return sendSuccess(res, result, 'Client Department created successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Get all client departments
exports.list = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get all client departments
        const result = await getAllClientDepartmentsService(req.query);

        // send response with the list of client departments
        return sendSuccess(res, result, 'Client Departments retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Get client department by ID
exports.getById = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get client department by ID
        const result = await getClientDepartmentByIdService(req.params.clientDepartmentId);

        // send response with the client department data
        return sendSuccess(res, result, 'Client Department retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Update client department by ID
exports.update = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to update client department by ID
        const result = await updateClientDepartmentService(req.params.clientDepartmentId, req.body);

        // send response with the updated client department data
        return sendSuccess(res, result, 'Client Department updated successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Delete client department by ID
exports.delete = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to delete client department by ID
        const result = await deleteClientDepartmentService(req.params.clientDepartmentId);

        // send response indicating successful deletion
        return sendSuccess(res, result, 'Client Department deleted successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};