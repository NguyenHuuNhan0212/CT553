const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // chủ sở hữu
    type: {
      type: String,
      enum: ['hotel', 'restaurant', 'touristSpot', 'cafe'],
      required: true
    },
    name: String,
    address: { type: String },

    description: String,
    avgPrice: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model('Place', placeSchema);
