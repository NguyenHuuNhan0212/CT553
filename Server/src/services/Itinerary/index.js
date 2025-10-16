const ItineraryModel = require('../../models/Itinerary');
const UserModel = require('../../models/User');
const ItineraryDetailModel = require('../../models/ItineraryDetail');

const handleCreate = async (userId, data) => {
  const { title, destination, startDate, creatorName, endDate, details } = data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const numDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const itinerary = await ItineraryModel.create({
    userId,
    title,
    destination,
    numDays,
    creatorName,
    startDate,
    endDate
  });

  if (details && details.length > 0) {
    const detailDocs = details.map((d) => ({
      itineraryId: itinerary._id,
      placeId: d.placeId,
      visitDay: d.visitDay,
      note: d.note,
      startTime: d.startTime,
      endTime: d.endTime
    }));
    await ItineraryDetailModel.insertMany(detailDocs);
  }
  return {
    message: 'Created Itinerary successfully'
  };
};

const handleGetAllByUserId = async (userId) => {
  const itineraries = await ItineraryModel.find({ userId })
    .lean()
    .sort({ createdAt: -1 });
  if (!itineraries.length) return [];
  return {
    itineraries
  };
};
module.exports = { handleCreate, handleGetAllByUserId };
