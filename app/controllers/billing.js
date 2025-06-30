// utilities
const { 
    getToken, 
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services
const {
    createBillingService, 
    getAllBillingsService, 
    getBillingByIdService, 
    updateBillingService, 
    deleteBillingService
} = require('@services/billing');


// create a new billing
exports.create = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to create a new billing
        const result = await createBillingService(req.body);

        // send response with the created billing data
        return sendSuccess(res, result, 'Billing created successfully.');
    } catch (error) {
        console.error('Error creating billing:', error);
        return sendError(res, '', error.message, error.status);
    }
};


// get all billings
exports.list = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get all billings
        const result = await getAllBillingsService(req.query);

        // send response with the list of billings
        return sendSuccess(res, result, 'Billings retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// get billing by ID
exports.getById = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get billing by ID
        const result = await getBillingByIdService(req.params.billingId);

        // send response with the billing data
        return sendSuccess(res, result, 'Billing retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// update billing by ID
exports.update = async (req, res) => {
    // check if user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to update billing by ID
        const result = await updateBillingService(req.params.billingId, req.body);

        // send response with the updated billing data
        return sendSuccess(res, result, 'Billing updated successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    };
};


// delete billing by ID
exports.delete = async (req, res) => {
    // check if user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to delete billing by ID
        const result = await deleteBillingService(req.params.billingId);

        // send response with success message
        return sendSuccess(res, result, 'Billing deleted successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};

