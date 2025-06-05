// model imports
const { User } = require('@models');

// utility functions
const { 
    hashPassword,
    comparePassword, 
    generateToken, 
} = require('@utils/methods');

// validators
const { validateLoginFields, validateCreateUserFields } = require('@validators/auth');


// service to create a new user
exports.createUserService = async (data) => {
    const { 
        user_fname, 
        user_lname, 
        user_role, 
        user_username, 
        user_department_id, 
        user_password 
    } = data;

    // Validate that all required fields are provided
    validateCreateUserFields(data);

    // Check if the user already exists by username
    const existingUser = await User.findOne({ where: { user_username } });

    // If username is already taken, throw a 409 conflict error
    if (existingUser) {
        const error = new Error('Username already exists.');
        error.status = 409;
        throw error;
    }

    // Hash the provided password before storing
    const hashedPassword = await hashPassword(user_password);

    // Create the new user record in the database
    const newUser = await User.create({
        user_fname,
        user_lname,
        user_role,
        user_username,
        user_department_id,
        user_password: hashedPassword
    });

    // Return the newly created user
    return newUser;
};


// service to login a user
exports.loginService = async (data) => {
    const { user_username, user_password } = data;

    // Validate input
    validateLoginFields(data);

    // Check if the user exists
    const user = await User.findOne({ where: { user_username } });
    if (!user) {
        const error = new Error('User not found.');
        error.status = 404;
        throw error;
    }

    // validate the password
    const isPasswordValid = await comparePassword(user_password, user.user_password);
    if (!isPasswordValid) {
        const error = new Error('Invalid password.');
        error.status = 401;
        throw error;
    }

    const token = generateToken(user);
    return token;
};
