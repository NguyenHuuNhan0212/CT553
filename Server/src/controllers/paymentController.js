const { vnpay } = require('../config/vnpay.js');
const Booking = require('../models/Booking.js');
const Payment = require('../models/Payment.js');
const {
  createPayment,
  handleVNPayReturn,
  handleGetAllTransaction,
  handleGetAllTransactionCancelled,
  handleGetAllTransactionSuccess
} = require('../services/Payment');
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
const getAllTransaction = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetAllTransaction(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAllTransactionCancelled = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetAllTransactionCancelled(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllTransactionSuccess = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetAllTransactionSuccess(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPaymentUrl,
  vnpayReturn,
  getAllTransaction,
  getAllTransactionCancelled,
  getAllTransactionSuccess
};
