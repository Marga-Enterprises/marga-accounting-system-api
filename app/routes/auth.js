const express = require('express');
const router = express.Router();

// Import the auth controller
const authController = require('@controllers/auth');

// Define routes for authentication operations
router.post('/create', authController.create);
router.post('/login', authController.login);

// Export the router to be used in the main app
module.exports = router;