const { vnpay } = require('../utils/vnpay.js');
const Booking = require('../models/Booking.js');
const Payment = require('../models/Payment.js');

const createPaymentUrl = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: booking.totalPrice * 100, // nhân 100 vì VNPay yêu cầu đơn vị là VND * 100
      vnp_IpAddr: req.ip,
      vnp_TxnRef: `${bookingId}-${Date.now()}`,
      vnp_OrderInfo: `Thanh toan booking ${bookingId}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: 'http://localhost:3001/api/payment/payment_return'
    });

    res.json({ paymentUrl });
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
    const amount = req.query.vnp_Amount / 100;
    const transactionNo = req.query.vnp_TransactionNo;
    const isSuccess = String(req.query.vnp_ResponseCode) === '00';
    await Payment.create({
      paymentId: `${Date.now()}`,
      bookingId,
      vnpayTransactionNo: transactionNo,
      amount,
      status: req.query.vnp_ResponseCode === '00' ? 'success' : 'failed'
    });
    if (isSuccess) {
      await Booking.updateOne({ bookingId }, { status: 'paid' });
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
