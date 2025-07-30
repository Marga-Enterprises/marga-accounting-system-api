// validatePaymentFields function to validate payment fields
exports.validatePaymentFields = (data) => {
    const {
        payment_collection_id,
        payment_amount,
        payment_or_number,
        payment_mode,
    } = data;

    if (
        !payment_collection_id ||
        !payment_amount ||
        !payment_or_number ||
        !payment_mode
    ) {
        throw new Error('All fields are required.');
    } else if (isNaN(payment_amount) || payment_amount <= 0) {
        throw new Error('Invalid payment amount.');
    }

    return true;
};

// validatePaymentId function to validate the payment ID
exports.validatePaymentId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing payment ID.');
    }

    return true;
};

// validateListPaymentsParams function to validate the query parameters for listing payments
exports.validateListPaymentsParams = (query) => {
    const { pageIndex, pageSize } = query;

    if (
        !pageIndex ||
        !pageSize ||
        isNaN(pageIndex) ||
        isNaN(pageSize) ||
        pageIndex < 0 ||
        pageSize <= 0
    ) {
        throw new Error('Invalid pagination parameters.');
    }

    return true;
};