const { hashPassword, comparePassword, generateToken } = require('@utils/methods');
const { User } = require('@models');

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

    // Validate required fields
    if (!user_fname || !user_lname || !user_role || !user_username || !user_department_id || !user_password) {
        throw new Error({status: 400, message: 'All fields are required.'});
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ where: { user_username } });
    if (existingUser) throw new Error({ status: 409, message: 'Username already exists.' });

    // Hash the password
    const hashedPassword = await hashPassword(user_password);

    // Create the new user
    const newUser = await User.create({
        user_fname,
        user_lname,
        user_role,
        user_username,
        user_department_id,
        user_password: hashedPassword
    });

    return newUser;
};


// service to login a user
exports.loginService = async (user_username, user_password) => {
    // Validate input
    if (!user_username || !user_password) {
        throw new Error({ status: 400, message: 'Username and password are required.' });
    }

    // Find the user by username
    const user = await User.findOne({ where: { user_username } });
    if (!user) throw new Error({ status: 404, message: 'User not found.' });

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await comparePassword(user_password, user.user_password);
    if (!isPasswordValid) throw new Error({ status: 401, message: 'Invalid password.' });

    // Generate a token for the user
    const token = generateToken(user);

    return token;
};