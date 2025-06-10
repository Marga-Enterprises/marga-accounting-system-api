//utilities
const { 
    getToken, 
    decodeToken, 
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services
const { createUserService, loginService } = require('@services/auth');


// Login function
exports.login = async (req, res) => {
    // check if the user is already logged in
    const token = getToken(req.headers);
    if (token) return sendError(res, '', 'You are already logged in.');

    try {
        // call the service to login the user
        const result = await loginService(req.body);

        // if login is successful, send the token in the response
        return sendSuccess(res, result , 'Login successful.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// create a new user function
exports.create = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    // decode token to get user info
    const decodedToken = decodeToken(token);
    if (!decodedToken) return sendUnauthorizedError(res, '', 'Invalid token, Unable to decode.', 401);

    // check user_role if the user is "owner" or "manager"
    if (decodedToken.user_role !== 'owner' && decodedToken.user_role !== 'manager') {
        return sendUnauthorizedError(res, '', 'You do not have permission to create a user.', 403);
    }

    try {
        // call the service to create a new user
        const result = await createUserService(req.body);

        // send response with the created user data
        return sendSuccess(res, result, 'User created.');
    } catch (error) {
        return sendError(res, '', error.message, error.status );
    }
};


