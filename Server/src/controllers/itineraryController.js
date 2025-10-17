const {
  handleCreate,
  handleGetAllByUserId,
  handleGetItineraryDetail,
  handleUpdateStatus,
  handleAddPriceAndGuest,
  handleDeleteItinerary
} = require('../services/Itinerary');

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

const getItineraryDetail = async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const result = await handleGetItineraryDetail(itineraryId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const updateStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itineraryId } = req.params;
    const result = await handleUpdateStatus(userId, itineraryId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const addPeopleAndPrice = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itineraryId } = req.params;
    const data = req.body;
    const result = await handleAddPriceAndGuest(userId, itineraryId, data);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const deleteItinerary = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itineraryId } = req.params;
    const result = await handleDeleteItinerary(userId, itineraryId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  createItinerary,
  getAllItinerariesByUserId,
  getItineraryDetail,
  updateStatus,
  addPeopleAndPrice,
  deleteItinerary
};
