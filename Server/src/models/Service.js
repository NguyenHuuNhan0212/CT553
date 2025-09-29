const mongoose = require('mongoose');

const serviceOtherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    type: String,
    isActive: { type: Boolean, default: true },
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place'
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel'
    }
  },
  { timestamps: true }
);
serviceOtherSchema.pre('validate', function (next) {
  if (!this.placeId && !this.hotelId) {
    return next(new Error('Cần chọn Place hoặc Hotel'));
  }
  if (this.placeId && this.hotelId) {
    return next(new Error('Chỉ được chọn 1 trong Place hoặc Hotel'));
  }
  next();
});
module.exports = mongoose.model('Service', serviceOtherSchema);
