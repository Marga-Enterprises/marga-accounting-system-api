// validateLoginFields function to validate the fields required for user login
exports.validateDepartmentFields = (data) => {
    const { department_name } = data;

    if (!department_name || typeof department_name !== 'string') {
        throw new Error('Invalid or missing department name.');
    }

    return true;
};


// validateListDepartmentsParams function to validate the query parameters for listing departments
exports.validateListDepartmentsParams = (query) => {
    const { pageIndex, pageSize } = query;

    if (
        !pageIndex ||
        !pageSize ||
        isNaN(pageIndex) ||
        isNaN(pageSize) ||
        pageIndex < 0 ||
        pageSize <= 0
    ) throw new Error('Invalid pagination parameters.');

    return true;
};


// validateDepartmentId function to validate the department ID
exports.validateDepartmentId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing department ID.');
    }

    return true;
};
