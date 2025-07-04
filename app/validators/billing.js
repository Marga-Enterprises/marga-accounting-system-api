// validateBillingFields function to validate billing fields
exports.validateBillingFields = (data) => {
    const {
        billing_client_id,
        billing_department_id,
        billing_invoice_number,
        billing_amount,
        billing_total_amount,
        billing_vat_amount,
        billing_discount,
        billing_month,
        billing_year,
        billing_type
    } = data;

    if (
        !billing_client_id ||
        !billing_department_id ||
        !billing_invoice_number || 
        !billing_amount || 
        !billing_total_amount || 
        !billing_vat_amount || 
        !billing_discount || 
        !billing_month || 
        !billing_year || 
        !billing_type
    ) {
        throw new Error('All fields are required.');
    }

    return true;
};

// validateBillingId function to validate the billing ID
exports.validateBillingId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing billing ID.');
    }

    return true;
};

// validateListBillingsParams function to validate the query parameters for listing billings
exports.validateListBillingsParams = (query) => {
    const { pageIndex, pageSize, billingMonth, billingYear } = query;

    if (
        !pageIndex ||
        !pageSize ||
        !billingMonth ||
        !billingYear ||
        isNaN(pageIndex) ||
        isNaN(pageSize) ||
        pageIndex < 0 ||
        pageSize <= 0
    ) {
        throw new Error('Invalid pagination parameters.');
    }

    return true;
};