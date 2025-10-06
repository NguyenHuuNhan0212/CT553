const express = require('express');
const {
  createPaymentUrl,
  vnpayReturn
} = require('../controllers/paymentController.js');

const router = express.Router();

router.post('/create-payment-url', createPaymentUrl);
router.get('/payment-return', vnpayReturn);

module.exports = router;
