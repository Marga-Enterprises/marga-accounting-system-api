const express = require('express');
const router = express.Router();

// Import the billing controller
const billingController = require('@controllers/billing');

// Define routes for billing operations
router.post('/', billingController.create);
router.get('/', billingController.list);
router.get('/:billingId', billingController.getById);
router.put('/:billingId', billingController.update);
router.delete('/:billingId', billingController.delete);
router.post('/cancel/:billingId', billingController.cancel);

// Export the router to be used in the main app
module.exports = router;
