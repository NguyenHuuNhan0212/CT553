const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    numDays: { type: Number },
    creatorName: { type: String, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'completed'],
      default: 'upcoming'
    },
    people: { type: Number },
    priceForItinerary: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);
module.exports = mongoose.model('Itinerary', itinerarySchema);
