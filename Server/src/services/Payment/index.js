const PaymentModel = require('../../models/Payment');
const BookingModel = require('../../models/Booking');
const { vnpay } = require('../../config/vnpay');

const createPaymentOffline = async (bookingId) => {
  const paymentCheck = await PaymentModel.findOne({ bookingId });
  if (paymentCheck) {
    throw new Error('Payment existed');
  } else {
    const booking = await BookingModel.findById(bookingId);
    await PaymentModel.create({
      bookingId,
      amount: 0,
      method: 'offline',
      paymentType: 'full'
    });
    await BookingModel.findByIdAndUpdate(bookingId, { status: 'confirmed' });
    return {
      message: 'Tạo payment cho thanh toán offline thành công'
    };
  }
};
const createPaymentOnline = async (bookingId, deposit) => {
  const booking = await BookingModel.findOne({
    _id: bookingId,
    status: 'pending'
  });
  if (!booking) {
    throw new Error('Booking not found');
  }
  const totalAmount = deposit
    ? Math.round(booking.totalPrice * 0.3)
    : booking.totalPrice;
  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: totalAmount,
    vnp_IpAddr: '127.0.0.1',
    vnp_TxnRef: `${bookingId}-${Date.now()}`,
    vnp_OrderInfo: `Thanh toan booking ${bookingId}`,
    vnp_OrderType: 'booking',
    vnp_ReturnUrl: 'http://localhost:3000/api/payment/payment-return'
  });

  return { paymentUrl };
};
const createPayment = async (bookingId, deposit, isOffline) => {
  return isOffline
    ? createPaymentOffline(bookingId)
    : createPaymentOnline(bookingId, deposit);
};
const handleVNPayReturn = async (query) => {
  const verify = vnpay.verifyReturnUrl(query);
  const bookingId = query.vnp_TxnRef.split('-')[0];
  const booking = await BookingModel.findById(bookingId);
  const amount = Number(query.vnp_Amount) / 100;
  const transactionNo = query.vnp_TransactionNo;
  const isSuccess = String(query.vnp_ResponseCode) === '00';
  const isDeposit = Number(amount) < Number(booking.totalPrice);
  if (!verify.isSuccess) {
    await BookingModel.findByIdAndDelete(bookingId);
    return {
      redirectUrl: `http://localhost:5173/payment-return?status=${'cancelled'}`
    };
  }

  await PaymentModel.create({
    bookingId,
    vnpayTransactionNo: transactionNo,
    amount,
    status: query.vnp_ResponseCode === '00' ? 'success' : 'failed',
    method: 'online',
    paymentType: isDeposit ? 'deposit' : 'full',
    paymentDate: Date.now()
  });
  if (isSuccess && isDeposit) {
    await BookingModel.findByIdAndUpdate(bookingId, { status: 'paid' });
  } else if (isSuccess && !isDeposit) {
    await BookingModel.findByIdAndUpdate(bookingId, { status: 'confirmed' });
  }

  return {
    redirectUrl: `http://localhost:5173/payment-return?status=${
      isSuccess ? 'success' : 'failed'
    }&bookingId=${bookingId}&amount=${amount}`
  };
};

const handleGetAllTransaction = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền truy cập.');
  }

  const transactions = await PaymentModel.find({ amount: { $gt: 0 } })
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'userId', select: '-password' },
        {
          path: 'placeId',
          populate: { path: 'userId', select: '-password' }
        }
      ]
    })
    .lean()
    .sort({ createdAt: -1 });
  const result = transactions.map((t) => {
    return {
      _id: t._id,
      userBooking: t.bookingId?.userId?.fullName || null,
      supplier: t.bookingId?.placeId?.userId?.fullName || null,
      services: t.bookingId?.bookingDetails || [],
      amount: t.amount,
      placeName: t.bookingId?.placeId?.name,
      paymentMethod: t.method,
      paymentDate: t.paymentDate,
      paymentStatus: t.status,
      bookingStatus: t.bookingId?.status
    };
  });
  return {
    transactions: result
  };
};
module.exports = { createPayment, handleVNPayReturn, handleGetAllTransaction };
