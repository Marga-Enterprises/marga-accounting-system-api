const express = require('express');
const router = express.Router();

// Import the deaprtment controller
const departmentController = require('@controllers/department');

// Define routes for department operations
router.post('/', departmentController.create);
router.get('/', departmentController.list);
router.get('/:departmentId', departmentController.getById);
router.put('/:departmentId', departmentController.update);
router.delete('/:departmentId', departmentController.delete);

// Export the router to be used in the main app
module.exports = router;