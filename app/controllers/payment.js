// utilities
const {
    getToken,
    sendSuccess,
    sendError,
    sendUnauthorizedError
} = require('@utils/methods');

// services
const {
    createPaymentService,
    getAllPaymentsService,
    getPaymentByIdService,
    deletePaymentByIdService,
    cancelPaymentService
} = require('@services/payment');


// create a new payment
exports.createPayment = async (req, res) => {
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to create a new payment
        const result = await createPaymentService(req.body);

        // send response with the created payment data
        return sendSuccess(res, result, 'Payment created successfully.');   
    } catch (error) {
        console.error('Error creating payment:', error);
        return sendError(res, '', error.message, error.status);
    }
};


// list all payments
exports.getAllPayments = async (req, res) => {
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to list all payments
        const result = await getAllPaymentsService(req.query);

        // send response with the list of payments
        return sendSuccess(res, result, 'Payments retrieved successfully.');
    } catch (error) {
        console.error('Error listing payments:', error);
        return sendError(res, '', error.message, error.status);
    }
};


// get payment by ID
exports.getPaymentById = async (req, res) => {
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get payment by ID
        const result = await getPaymentByIdService(req.params.paymentId);

        // send response with the payment data
        return sendSuccess(res, result, 'Payment retrieved successfully.');
    } catch (error) {
        console.error('Error getting payment by ID:', error);
        return sendError(res, '', error.message, error.status);
    }
};


// delete payment by ID
exports.deletePaymentById = async (req, res) => {
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to delete payment by ID
        await deletePaymentByIdService(req.params.paymentId);

        // send response indicating successful deletion
        return sendSuccess(res, {}, 'Payment deleted successfully.');
    } catch (error) {
        console.error('Error deleting payment by ID:', error);
        return sendError(res, '', error.message, error.status);
    }
};


// cancel payment by ID
exports.cancelPayment = async (req, res) => {
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to cancel payment
        const result = await cancelPaymentService(req.params.paymentId);

        // send response indicating successful cancellation
        return sendSuccess(res, result, 'Payment cancelled successfully.');
    } catch (error) {
        console.error('Error cancelling payment:', error);
        return sendError(res, '', error.message, error.status);
    }
};