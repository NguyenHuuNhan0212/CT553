const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // chủ sở hữu
    type: {
      type: String,
      enum: ['restaurant', 'touristSpot', 'cafe'],
      required: true
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    images: [{ type: String }],
    description: String,
    isActive: { type: Boolean, default: true },
    isApprove: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    totalServices: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Place', placeSchema);
