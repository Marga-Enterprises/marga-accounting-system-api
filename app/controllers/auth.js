// models
// const { User } = require('@models');

//utilities
const { 
    getToken, 
    decodeToken, 
    generateToken, 
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services
const { createUserService, loginService } = require('@services/authServices');

// redis
const redisClient = require('@config/redis');

// Login function
exports.login = async (req, res) => {
    // check if the user is already logged in
    const token = getToken(req.headers);
    if (token) return sendError(res, '', 'You are already logged in.');
    
    try {
        // call the service to login the user
        const result = await loginService(req.body);
        return sendSuccess(res, result , 'Login successful.');
    } catch (error) {
        console.error('Internal server error:', error);
        return sendError(res, '', 'Internal server error.', 500);
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
        console.error('Internal server error: ', error);
        const status = error.status || 500;
        return sendError(res, '', error.message || 'Something went wrong', status);
    }
};


/*
exports.list = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    // decode token to get user info
    const decodedToken = decodeToken(token);
    if (!decodedToken) return sendUnauthorizedError(res, '', 'Invalid token, Unable to decode.', 401);

    // check user_role if the user is "owner" or "manager"
    if (decodedToken.user_role !== 'owner' && decodedToken.user_role !== 'manager') {
        return sendUnauthorizedError(res, '', 'You do not have permission to list users.', 403);
    }

    try {
        let { 
            pageIndex, 
            pageSize, 
            user_role, 
            user_department,
            user_username,
            user_fname,
            user_lname,     
        } = req.query;
    } catch (error) {
        console.error('Internal server error: ', error);
        return sendError(res, '', 'Internal server error.', 500);
    }
};
*/