const {
  addPlaceService,
  getAllPlaceOffUser,
  getOnePlace,
  getAllPlace,
  getPlaceRelative,
  removePlace,
  updateActivePlace,
  updatePlaceService
} = require('../services/Place');

const addPlace = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;
    const imagePaths =
      req.files?.map((file) => `uploads/${file.filename}`) || [];
    const result = await addPlaceService(userId, {
      ...data,
      images: imagePaths
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllPlaceOffUserById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getAllPlaceOffUser(userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getInfoOnePlace = async (req, res) => {
  try {
    const { placeId } = req.params;
    const result = await getOnePlace(placeId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAll = async (req, res) => {
  try {
    const result = await getAllPlace();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getPlaceRelativeByTypeAndAddress = async (req, res) => {
  try {
    const { id, type, address } = req.query;
    const result = await getPlaceRelative(id, type, address);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deletePlace = async (req, res) => {
  try {
    const { userId } = req.user;
    const { placeId } = req.params;
    const result = await removePlace(userId, placeId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const updateStatusActive = async (req, res) => {
  try {
    const { userId } = req.user;
    const { placeId } = req.params;
    const result = await updateActivePlace(userId, placeId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const updatePlace = async (req, res) => {
  try {
    const userId = req.user.userId;
    const placeId = req.params.placeId;
    const data = req.body;

    // xử lý images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/${file.filename}`);
    }
    data.images = images;

    const result = await updatePlaceService(placeId, userId, data);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
module.exports = {
  addPlace,
  getAllPlaceOffUserById,
  getInfoOnePlace,
  getAll,
  getPlaceRelativeByTypeAndAddress,
  deletePlace,
  updateStatusActive,
  updatePlace
};
