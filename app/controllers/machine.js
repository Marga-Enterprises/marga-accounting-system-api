//utilities
const { 
    getToken, 
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services 
const {
    createMachineService,
    getAllMachinesService,
    getMachineByIdService,
    updateMachineByIdService,
    deleteMachineByIdService
} = require('@services/machine');


// create a new machine
exports.create = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to create a new machine
        const result = await createMachineService(req.body);

        // send response with the created machine data
        return sendSuccess(res, result, 'Machine created successfully.');
    } catch (error) {
        console.error('Error creating machine:', error);
        return sendError(res, '', error.message, error.status);
    }
};


// get all machines
exports.list = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get all machines
        const result = await getAllMachinesService(req.query);

        // send response with the list of machines
        return sendSuccess(res, result, 'Machines retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
}


// get machine by ID
exports.getById = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get machine by ID
        const result = await getMachineByIdService(req.params.machineId);

        // send response with the machine data
        return sendSuccess(res, result, 'Machine retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// update machine by ID
exports.update = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to update machine by ID
        const result = await updateMachineByIdService(req.params.machineId, req.body);

        // send response with the updated machine data
        return sendSuccess(res, result, 'Machine updated successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// delete machine by ID
exports.delete = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to delete machine by ID
        const result = await deleteMachineByIdService(req.params.machineId);

        // send response with the deletion confirmation
        return sendSuccess(res, result, 'Machine deleted successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};