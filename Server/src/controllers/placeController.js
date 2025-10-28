const {
  addPlaceService,
  getAllPlaceOfUser,
  getOnePlace,
  getAllPlace,
  getPlaceRelative,
  removePlace,
  updateActivePlace,
  updatePlaceService,
  getHotelsNearPlace,
  getPlacesByAddressAndType,
  getPlacesPopularByType,
  getPlacesPopular,
  handleGetStatsPlace,
  handleGetPlacesAwaitConfirm,
  handleApprovePlace,
  handleGetAllAdmin,
  handleRejectPlace
} = require('../services/Place');

const {
  handleAddPlaceFavorite,
  handleRemovePlaceFavorite,
  handleGetPlacesFavorite
} = require('../services/PlaceFavorite');
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
    const { type } = req.query;
    if (type) {
      const result = await getPlacesPopularByType(type);
      return res.status(200).json(result);
    } else {
      const result = await getAllPlace();
      res.status(200).json(result);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getPlaceRelativeByTypeAndAddress = async (req, res) => {
  try {
    const { id, type, address } = req.query;

    let result = null;
    if (!id && type && address) {
      result = await getPlacesByAddressAndType(type, address);
    } else {
      result = await getPlaceRelative(id, type, address);
    }

    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAllByUserId = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await getAllPlaceOfUser(userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getHotelsNear = async (req, res) => {
  try {
    const { address } = req.query;
    const result = await getHotelsNearPlace(address);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
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

    let finalImages = [];

    if (data.images) {
      if (Array.isArray(data.images)) {
        finalImages = data.images.filter((img) => typeof img === 'string');
      } else if (typeof data.images === 'string') {
        finalImages = [data.images];
      }
    }

    // Ảnh mới từ multer
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `uploads/${file.filename}`);
      finalImages = [...finalImages, ...newImages];
    }

    data.images = finalImages;
    const result = await updatePlaceService(placeId, userId, data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getPlacesPopularController = async (req, res) => {
  try {
    const result = await getPlacesPopular();
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addPlaceFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const { placeId } = req.body;
    const result = await handleAddPlaceFavorite(userId, placeId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removePlaceFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const { placeId } = req.params;
    const result = await handleRemovePlaceFavorite(userId, placeId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPlacesFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await handleGetPlacesFavorite(userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStatsPlace = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetStatsPlace(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPlacesAwaitConfirm = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetPlacesAwaitConfirm(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const approvePlace = async (req, res) => {
  try {
    const { role } = req.user;
    const { placeId } = req.params;
    const result = await handleApprovePlace(role, placeId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllAdmin = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetAllAdmin(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rejectPlace = async (req, res) => {
  try {
    const { role } = req.user;
    const { placeId } = req.params;
    const result = await handleRejectPlace(role, placeId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  addPlace,
  getInfoOnePlace,
  getAll,
  getPlaceRelativeByTypeAndAddress,
  deletePlace,
  updateStatusActive,
  getAllByUserId,
  updatePlace,
  getHotelsNear,
  getPlacesPopularController,
  addPlaceFavorite,
  removePlaceFavorite,
  getPlacesFavorite,
  getStatsPlace,
  getPlacesAwaitConfirm,
  approvePlace,
  getAllAdmin,
  rejectPlace
};
