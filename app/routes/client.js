const express = require('express');
const router = express.Router();

// Import the client controller
const clientController = require('@controllers/client');

// Define routes for client operations
router.post('/', clientController.create);
router.get('/', clientController.list);
router.get('/:clientId', clientController.getById);
router.put('/:clientId', clientController.update);
router.delete('/:clientId', clientController.delete);

// Export the router to be used in the main app
module.exports = router;