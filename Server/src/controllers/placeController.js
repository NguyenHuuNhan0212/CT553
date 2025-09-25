const {
  addPlaceService,
  getAllPlaceOffUser,
  getOnePlace
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
module.exports = {
  addPlace,
  getAllPlaceOffUserById,
  getInfoOnePlace
};
