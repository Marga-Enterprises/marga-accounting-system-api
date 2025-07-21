const express = require('express');
const router = express.Router();

// Import the client department controller
const clientDepartmentController = require('@controllers/clientdepartment');

// Define routes for client department operations
router.post('/', clientDepartmentController.create);
router.get('/', clientDepartmentController.list);
router.get('/name', clientDepartmentController.getByName);
router.get('/:clientDepartmentId', clientDepartmentController.getById);
router.put('/:clientDepartmentId', clientDepartmentController.update);
router.delete('/:clientDepartmentId', clientDepartmentController.delete);
router.post('/send-email-to-clients', clientDepartmentController.sendEmailNotification);

// Export the router to be used in the main app
module.exports = router;