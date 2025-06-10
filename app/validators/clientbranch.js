// validateClientBranchFields function to validate the fields required for client branch operations
exports.validateClientBranchFields = (data) => {
    const { client_branch_name, client_branch_client_id, client_branch_address } = data;

    if (!client_branch_name || typeof client_branch_name !== 'string') {
        throw new Error('Invalid or missing client branch name.');
    }
    if (!client_branch_client_id || isNaN(client_branch_client_id)) {
        throw new Error('Invalid or missing client ID for the branch.');
    }
    if (!client_branch_address || typeof client_branch_address !== 'string') {
        throw new Error('Invalid or missing client branch address.');
    }

    return true;
};


// validateClientBranchId function to validate the client branch ID
exports.validateClientBranchId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing client branch ID.');
    }

    return true;
};


// validateListClientBranchesParams function to validate the query parameters for listing client branches
exports.validateListClientBranchesParams = (query) => {
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


// validateClientId function to validate the parent client ID
exports.validateClientId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing client ID.');
    }

    return true;
};