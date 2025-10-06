const { vnpay } = require('../config/vnpay.js');
const Booking = require('../models/Booking.js');
const Payment = require('../models/Payment.js');

const createPaymentUrl = async (req, res) => {
  try {
    const { bookingId, deposit } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      status: 'pending'
    });
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    const totalAmount = deposit
      ? Math.round(booking.totalPrice * 0.3)
      : booking.totalPrice;
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: totalAmount,
      vnp_IpAddr: req.ip,
      vnp_TxnRef: `${bookingId}-${Date.now()}`,
      vnp_OrderInfo: `Thanh toan booking ${bookingId}`,
      vnp_OrderType: 'booking',
      vnp_ReturnUrl: 'http://localhost:3000/api/payment/payment-return'
    });

    return res.status(200).json({ paymentUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const vnpayReturn = async (req, res) => {
  try {
    const verify = vnpay.verifyReturnUrl(req.query);
    if (!verify.isSuccess)
      return res.redirect(
        `http://localhost:5173/payment-return?status=${'cancelled'}`
      );

    const bookingId = req.query.vnp_TxnRef.split('-')[0];
    const booking = await Booking.findById(bookingId);
    const amount = Number(req.query.vnp_Amount) / 100;
    const transactionNo = req.query.vnp_TransactionNo;
    const isSuccess = String(req.query.vnp_ResponseCode) === '00';
    const isDeposit = Number(amount) < Number(booking.totalPrice);

    await Payment.create({
      bookingId,
      vnpayTransactionNo: transactionNo,
      amount,
      status: req.query.vnp_ResponseCode === '00' ? 'success' : 'failed',
      method: 'online',
      paymentType: isDeposit ? 'deposit' : 'full',
      paymentDate: Date.now()
    });
    if (isSuccess) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'paid' });
    }

    res.redirect(
      `http://localhost:5173/payment-return?status=${
        isSuccess ? 'success' : 'failed'
      }&bookingId=${bookingId}&amount=${amount}`
    );
  } catch (err) {
    res.status(500).send(err.message);
  }
};
module.exports = { createPaymentUrl, vnpayReturn };
