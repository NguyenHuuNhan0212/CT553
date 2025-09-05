const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    vnpayTransactionNo: { type: String },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
