const { handleCreate, handleGetAllByUserId } = require('../services/Itinerary');

const createItinerary = async (req, res) => {
  try {
    const data = req.body;
    const { userId } = req.user;
    const result = await handleCreate(userId, data);
    return res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllItinerariesByUserId = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await handleGetAllByUserId(userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  createItinerary,
  getAllItinerariesByUserId
};
