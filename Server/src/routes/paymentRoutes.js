const express = require('express');
const {
  createPaymentUrl,
  vnpayReturn,
  getAllTransaction
} = require('../controllers/paymentController.js');
const verifyToken = require('../middlewares/authMiddleware.js');

const router = express.Router();

router
  .post('/create-payment-url', createPaymentUrl)
  .get('/payment-return', vnpayReturn)
  .get('/admin', verifyToken, getAllTransaction);

module.exports = router;
