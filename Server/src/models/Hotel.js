const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: true
    },

    commissionPerCentage: { type: Number }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hotel', hotelSchema);
