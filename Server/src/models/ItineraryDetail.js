const mongoose = require('mongoose');

const itineraryDetailSchema = new mongoose.Schema(
  {
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      required: true
    },
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place'
    },
    visitDay: { type: String, required: true },
    note: String,
    startTime: String,
    endTime: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('ItineraryDetail', itineraryDetailSchema);
