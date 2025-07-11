// validatingMachineFields function to validate machine fields
exports.validateMachineFields = (data) => {
    const {
        machine_brand,
        machine_model,
        machine_serial_number,
    } = data;

    if (
        !machine_brand ||
        !machine_model ||
        !machine_serial_number 
    ) {
        throw new Error('All fields are required.');
    }

    return true;
};


// validateMachineId function to validate the machine ID
exports.validateMachineId = (id) => {
    if (!id || isNaN(id)) {
        throw new Error('Invalid or missing machine ID.');
    }

    return true;
};


// validateListMachinesParams function to validate the query parameters for listing machines
exports.validateListMachinesParams = (query) => {
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