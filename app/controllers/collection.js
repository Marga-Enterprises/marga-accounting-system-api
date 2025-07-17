// utilities 
const {
    getToken,
    sendSuccess,
    sendError,
    sendUnauthorizedError,
} = require('@utils/methods');

// services
const {
    createCollectionService,
    getAllCollectionsService,
    getCollectionByIdService,
    updateCollectionByIdService,
    deleteCollectionByIdService
} = require('@services/collection');


// create a new collection
exports.create = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to create a new collection
        const result = await createCollectionService(req.body);

        // send response with the created collection data
        return sendSuccess(res, result, 'Collection created successfully.');
    } catch (error) {
        console.error('Error creating collection:', error);
        return sendError(res, '', error.message, error.status);
    }
};


// get all collections
exports.list = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get all collections
        const result = await getAllCollectionsService(req.query);

        // send response with the list of collections
        return sendSuccess(res, result, 'Collections retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// get collection by ID
exports.getById = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to get the collection by ID 
        const result = await getCollectionByIdService(req.params.collectionId);

        // send response with the collection data
        return sendSuccess(res, result, 'Collection retrieved successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
};


// update collection by ID
exports.update = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to update the collection by ID
        const result = await updateCollectionByIdService(req.params.collectionId, req.body);

        // send response with the updated collection data
        return sendSuccess(res, result, 'Collection updated successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
}


// delete collection by ID 
exports.delete = async (req, res) => {
    // check if the user is logged in
    const token = getToken(req.headers);
    if (!token) return sendUnauthorizedError(res, '', 'You are not logged in.');

    try {
        // call the service to delete the collectiion by ID
        const result = await deleteCollectionByIdService(req.params.collectionId);

        // send response with the success message
        return sendSuccess(res, result, 'Collection deleted successfully.');
    } catch (error) {
        return sendError(res, '', error.message, error.status);
    }
}