const express = require('express');
const router = express.Router();

// Import the collection controller
const collectionController = require('@controllers/collection');

// Define routes for collection operations
router.post('/', collectionController.create);
router.get('/', collectionController.list);
router.get('/:collectionId', collectionController.getById);
router.put('/:collectionId', collectionController.update);
router.delete('/:collectionId', collectionController.delete);

// Export the router to be used in the main app
module.exports = router;