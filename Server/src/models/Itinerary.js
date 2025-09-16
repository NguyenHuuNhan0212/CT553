const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: String, required: true },
    numDays: { type: Number }
  },
  { timestamps: true }
);
module.exports = mongoose.model('Itinerary', itinerarySchema);
