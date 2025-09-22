import mongoose from 'mongoose';

const serviceBookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceOther',
      required: true
    },
    quantity: { type: Number, default: 1 },
    priceAtBooking: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('ServiceBooking', serviceBookingSchema);
