const mongoose = require('mongoose');

const bookingDetailSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType'
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    quantity: { type: Number, required: true },
    priceAtBooking: { type: Number }
  },
  { timestamps: true }
);

bookingDetailSchema.pre('validate', function (next) {
  if (!this.roomTypeId && !this.serviceId) {
    return next(new Error('Cần chọn RoomType hoặc Service'));
  }
  if (this.roomTypeId && this.serviceId) {
    return next(new Error('Chỉ được chọn 1 trong RoomType hoặc Service'));
  }
  next();
});
module.exports = mongoose.model('BookingDetail', bookingDetailSchema);
