const { vnpay } = require('../config/vnpay.js');
const Booking = require('../models/Booking.js');
const Payment = require('../models/Payment.js');
const { createPayment, handleVNPayReturn } = require('../services/Payment');
const createPaymentUrl = async (req, res) => {
  try {
    const { bookingId, deposit, isOffline } = req.body;
    const result = await createPayment(bookingId, deposit, isOffline);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const vnpayReturn = async (req, res) => {
  try {
    const result = await handleVNPayReturn(req.query);
    res.redirect(result.redirectUrl);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = { createPaymentUrl, vnpayReturn };
