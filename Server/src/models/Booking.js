const mongoose = require('mongoose');

const BookingDetailSchema = new mongoose.Schema(
  {
    roomTypeId: { type: mongoose.Schema.Types.ObjectId },
    serviceId: { type: mongoose.Schema.Types.ObjectId },
    serviceName: String,
    roomTypeName: String,
    quantity: Number,
    priceAtBooking: Number
  },
  { _id: false }
);
const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: true
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'paid'],
      default: 'pending'
    },
    bookingDetails: [BookingDetailSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
