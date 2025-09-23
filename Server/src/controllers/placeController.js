const { addPlaceService } = require('../services/Place');

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
module.exports = {
  addPlace
};
