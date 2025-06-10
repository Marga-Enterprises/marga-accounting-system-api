// validateLoginFields function to validate the fields required for user login
exports.validateLoginFields = (data) => {
    const { user_username, user_password } = data;
    
    if (!user_username || !user_password) {
        throw new Error('Username and password are required.');
    }
    
    return true;
}

// validateCreateUserFields function to validate the fields required for creating a new user
exports.validateCreateUserFields = (data) => {
    const { 
        user_fname, 
        user_lname, 
        user_role, 
        user_username, 
        user_department_id, 
        user_password 
    } = data;

    if (!user_fname || !user_lname || !user_role || !user_username || !user_department_id || !user_password) {
        throw new Error('All fields are required.');
    }

    return true;
}