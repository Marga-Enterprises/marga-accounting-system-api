//utilities
const { 
    getToken, 
    decodeToken, 
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services
const { 
    createDepartmentService, 
    getAllDepartmentsService, 
    getDepartmentByIdService, 
    updateDepartmentService, 
    deleteDepartmentService 
} = require('@services/department');


// Create a new department
exports.create = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to create a new department
        const result = await createDepartmentService(req.body);

        // send response with the created department data
        return sendSuccess(res, result, 'Department created successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Get all departments
exports.list = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    // decode the token to get user information
    const decodedToken = decodeToken(token);
    if (!decodedToken) return sendUnauthorizedError(res, '', 'Invalid token, Unable to decode.', 401);

    // check user_role if the user is "owner" or "manager"
    if (decodedToken.user_role !== 'owner' && decodedToken.user_role !== 'manager') {
        return sendUnauthorizedError(res, '', 'You do not have permission to view departments.', 403);
    }

    try {
        // call the service to get all departments
        const result = await getAllDepartmentsService(req.query);

        // send response with the list of departments
        return sendSuccess(res, result, 'Departments retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Get a department by ID
exports.getById = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    // decode the token to get user information
    const decodedToken = decodeToken(token);
    if (!decodedToken) return sendUnauthorizedError(res, '', 'Invalid token, Unable to decode.', 401);

    // check user_role if the user is "owner" or "manager"
    if (decodedToken.user_role !== 'owner' && decodedToken.user_role !== 'manager') {
        return sendUnauthorizedError(res, '', 'You do not have permission to view this department.', 403);
    }

    // get the department ID from the request parameters
    const departmentId = req.params.departmentId;

    try {
        // call the service to get the department by ID
        const result = await getDepartmentByIdService(departmentId);

        // send response with the department data
        return sendSuccess(res, result, 'Department retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Update a department by ID
exports.update = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    // decode the token to get user information
    const decodedToken = decodeToken(token);
    if (!decodedToken) return sendUnauthorizedError(res, '', 'Invalid token, Unable to decode.', 401);

    // check user_role if the user is "owner" or "manager"
    if (decodedToken.user_role !== 'owner' && decodedToken.user_role !== 'manager') {
        return sendUnauthorizedError(res, '', 'You do not have permission to update this department.', 403);
    }

    // get the department ID from the request parameters
    const departmentId = req.params.departmentId;

    try {
        // call the service to update the department by ID
        const result = await updateDepartmentService(departmentId, req.body);

        // send response with the updated department data
        return sendSuccess(res, result, 'Department updated successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// Delete a department by ID
exports.delete = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    // decode the token to get user information
    const decodedToken = decodeToken(token);
    if (!decodedToken) return sendUnauthorizedError(res, '', 'Invalid token, Unable to decode.', 401);

    // check user_role if the user is "owner" or "manager"
    if (decodedToken.user_role !== 'owner' && decodedToken.user_role !== 'manager') {
        return sendUnauthorizedError(res, '', 'You do not have permission to delete this department.', 403);
    }

    // get the department ID from the request parameters
    const departmentId = req.params.departmentId;

    try {
        // call the service to delete the department by ID
        await deleteDepartmentService(departmentId);

        // send response indicating successful deletion
        return sendSuccess(res, {}, 'Department deleted successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};