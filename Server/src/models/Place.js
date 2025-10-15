const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, default: 0 },
  type: { type: String }
});

const RoomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  totalRooms: { type: Number, default: 0 },
  pricePerNight: { type: Number, required: true }
});

const HotelDetailsSchema = new mongoose.Schema({
  facilities: [{ type: String }],
  roomTypes: [RoomTypeSchema]
});
const placeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // chủ sở hữu
    type: {
      type: String,
      enum: ['restaurant', 'touristSpot', 'cafe', 'hotel'],
      required: true
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    images: [{ type: String }],
    description: String,
    isActive: { type: Boolean, default: true },
    isApprove: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    totalServices: { type: Number, required: true, default: 0 },
    bookingCount: { type: Number, default: 0 },
    hotelDetail: HotelDetailsSchema,
    services: [ServiceSchema]
  },
  { timestamps: true }
);
placeSchema.pre('save', function (next) {
  this.totalServices =
    this.type !== 'hotel'
      ? this.services?.length || 0
      : (this.services?.length || 0) + 1;
  next();
});
module.exports = mongoose.model('Place', placeSchema);
