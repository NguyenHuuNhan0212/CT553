const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

module.exports = mongoose.model('Hotel', hotelSchema);
