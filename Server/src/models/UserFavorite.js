const mongoose = require('mongoose');
const userFavoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place'
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel'
    },
    addDate: { type: Date, default: Date.now() }
  },
  { timestamps: true }
);

userFavoriteSchema.pre('validate', function (next) {
  if (!this.placeId && !this.hotelId) {
    return next(new Error('Cần chọn Place hoặc Hotel'));
  }
  if (this.placeId && this.hotelId) {
    return next(new Error('Chỉ được chọn 1 trong Place hoặc Hotel'));
  }
  next();
});
module.exports = mongoose.model('UserFavorite', userFavoriteSchema);
