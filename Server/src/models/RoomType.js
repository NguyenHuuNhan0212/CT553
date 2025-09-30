const mongoose = require('mongoose');
const roomTypeSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    totalRooms: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    devices: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomType', roomTypeSchema);
