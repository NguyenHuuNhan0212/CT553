const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // chủ sở hữu
    type: {
      type: String,
      enum: ['hotel', 'restaurant', 'touristSpot', 'cafe'],
      required: true
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    images: [{ type: String }],
    description: String,
    avgPrice: Number,
    isActive: { type: Boolean, default: true },
    totalServices: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Place', placeSchema);
