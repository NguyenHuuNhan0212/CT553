const PaymentModel = require('../../models/Payment');
const BookingModel = require('../../models/Booking');

const createPaymentOffline = async (bookingId) => {
  const paymentCheck = await PaymentModel.findOne({ bookingId });
  if (paymentCheck) {
    throw new Error('Đơn đặt đã có trạng thái thanh toán');
  } else {
    const booking = await BookingModel.findById(bookingId);
    await PaymentModel.create({
      bookingId,
      amount: booking.totalPrice,
      method: 'offline',
      paymentType: 'full'
    });
    await BookingModel.findByIdAndUpdate(bookingId, { status: 'confirmed' });
    return {
      message: 'Tạo payment cho thanh toán offline thành công'
    };
  }
};

module.exports = { createPaymentOffline };
