const express = require('express');
const router = express.Router();

// controllers
const paymentController = require('@controllers/payment');

// routes for payment
router.post('/', paymentController.createPayment);
router.get('/', paymentController.getAllPayments);
router.get('/:paymentId', paymentController.getPaymentById);
router.put('/:paymentId', paymentController.updatePaymentById);
router.post('/cancel/:paymentId', paymentController.cancelPayment);

// export the router
module.exports = router;