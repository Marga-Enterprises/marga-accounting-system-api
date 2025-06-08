// validateClientFields function to validate the fields required for client operations
exports.validateClientFields = (data) => {
    const { client_name } = data;

    if (!client_name || typeof client_name !== 'string') {
        throw new Error('Invalid or missing client name.');
    }

    return true;
};


// validateListClientsParams function to validate the query parameters for listing clients
exports.validateListClientsParams = (query) => {
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


// validateClientId function to validate the client ID
exports.validateClientId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing client ID.');
    }

    return true;
};