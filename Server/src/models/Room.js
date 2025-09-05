const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true
    },
    roomNumber: String,
    description: String,
    status: {
      type: String,
      enum: ['available', 'booked', 'maintenance'],
      default: 'available'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
