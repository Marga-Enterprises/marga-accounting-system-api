// validateCollectionFields function to validate the fields required for collection operations
exports.validateCollectionFields = (data) => {
    const {
        collection_billing_id,
        collection_invoice_number,
        collection_amount,
    } = data;

    if (!collection_billing_id || isNaN(collection_billing_id)) {
        throw new Error('Invalid or missing billing ID for the collection.');
    };

    if (!collection_invoice_number || typeof collection_invoice_number !== 'string') {
        throw new Error('Invalid or missing invoice number for the collection.');
    };

    if (!collection_amount || isNaN(collection_amount) || collection_amount < 0) {
        throw new Error('Invalid or missing amount for the collection.');
    };

    return true;
};


// validateCollectionId function to validate the collection ID
exports.validateCollectionId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing collection ID.');
    }

    return true;
};


// validateListCollectionsParams function to validate the query parameters for listing collections
exports.validateListCollectionsParams = (query) => {
    const { pageIndex, pageSize, billingId } = query;

    if (
        !pageIndex ||
        !pageSize ||
        !billingId ||
        isNaN(billingId) ||
        isNaN(pageIndex) ||
        isNaN(pageSize) ||
        pageIndex < 0 ||
        pageSize <= 0
    ) throw new Error('Invalid pagination parameters.');

    return true;
};