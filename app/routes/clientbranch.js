const express = require('express');
const router = express.Router();

// Import the client branch controller
const clientBranchController = require('@controllers/clientbranch');

// Define routes for client branch operations
router.post('/', clientBranchController.create);
router.get('/', clientBranchController.list);
router.get('/:clientBranchId', clientBranchController.getById);
router.put('/:clientBranchId', clientBranchController.update);
router.delete('/:clientBranchId', clientBranchController.delete);

// Export the router to be used in the main app
module.exports = router;