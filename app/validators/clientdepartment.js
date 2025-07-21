// validateClientDepartmentFields function to validate the fields required for client department operations
exports.validateClientDepartmentFields = (data) => {
    const { client_department_name, client_department_client_id, client_department_address } = data;

    if (!client_department_name || typeof client_department_name !== 'string') {
        throw new Error('Invalid or missing client department name.');
    }
    if (!client_department_client_id || isNaN(client_department_client_id)) {
        throw new Error('Invalid or missing client ID for the department.');
    }
    if (!client_department_address || typeof client_department_address !== 'string') {
        throw new Error('Invalid or missing client department address.');
    }

    return true;
}


// validateClientDepartmentId function to validate the client department ID
exports.validateClientDepartmentId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing client department ID.');
    }

    return true;
};


// validateListClientDepartmentsParams function to validate the query parameters for listing client departments
exports.validateListClientDepartmentsParams = (query) => {
    const { pageIndex, pageSize, clientId } = query;

    if (
        !pageIndex ||
        !pageSize ||
        !clientId ||
        isNaN(clientId) ||
        isNaN(pageIndex) ||
        isNaN(pageSize) ||
        pageIndex < 0 ||
        pageSize <= 0
    ) throw new Error('Invalid pagination parameters.');

    return true;
};


// validateClientDepartmentName function to validate the client department name
exports.validateClientDepartmentName = (name) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error('Invalid or missing client department name.');
    }

    return true;
};


// validateClientId function to validate the parent client ID
exports.validateClientId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing client ID.');
    }

    return true;
};


// validateEmailNotificationParams function to validate the parameters for sending email notifications
exports.validateEmailNotificationParams = (data) => {
    const { clientIds, subject, message } = data;

    if (!Array.isArray(clientIds) || clientIds.length === 0) {
        throw new Error('Invalid or missing client IDs.');
    }

    if (!subject || typeof subject !== 'string') {
        throw new Error('Invalid or missing email subject.');
    }

    if (!message || typeof message !== 'string') {
        throw new Error('Invalid or missing email message.');
    }

    return true;
};