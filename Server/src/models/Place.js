const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // chủ sở hữu
    type: {
      type: String,
      enum: ['hotel', 'restaurant', 'touristSpot', 'cafe', 'historical'],
      required: true
    },
    name: String,
    address: String,
    description: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Place', placeSchema);
