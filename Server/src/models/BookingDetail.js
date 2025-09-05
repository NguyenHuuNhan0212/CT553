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
      ref: 'RoomType',
      required: true
    },
    quantity: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookingDetail', bookingDetailSchema);
