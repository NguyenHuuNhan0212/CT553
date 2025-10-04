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
    addDate: { type: Date, default: Date.now() }
  },
  { timestamps: true }
);
module.exports = mongoose.model('UserFavorite', userFavoriteSchema);
