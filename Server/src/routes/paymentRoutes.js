const express = require('express');
const {
  createPaymentUrl,
  vnpayReturn,
  getAllTransaction,
  getAllTransactionCancelled,
  getAllTransactionSuccess
} = require('../controllers/paymentController.js');
const verifyToken = require('../middlewares/authMiddleware.js');

const router = express.Router();

router
  .post('/create-payment-url', createPaymentUrl)
  .get('/payment-return', vnpayReturn)
  .get('/admin', verifyToken, getAllTransaction)
  .get('/admin/transaction-cancelled', verifyToken, getAllTransactionCancelled)
  .get('/admin/transaction-success', verifyToken, getAllTransactionSuccess);
module.exports = router;
