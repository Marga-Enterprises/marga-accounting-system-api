const express = require('express');
const router = express.Router();

// Import the machine controller
const machineController = require('@controllers/machine');

// Define routes for machine operations
router.post('/', machineController.create);
router.get('/', machineController.list);
router.get('/:machineId', machineController.getById);
router.put('/:machineId', machineController.update);
router.delete('/:machineId', machineController.delete);

// Export the router to be used in the main app
module.exports = router;