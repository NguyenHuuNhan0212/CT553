const {
  getMyInfo,
  uploadAvatarService,
  uploadProfile,
  changePassword,
  upgradeToProvider,
  handleGetStatsUser,
  handleGetAllAccountUpgradeProvider,
  handleConfirmUpgradeToProvider,
  handleRejectUpgradeToProvider,
  handleGetAllUser,
  handleGetAllSupplier,
  getAllPlacesChat,
  handleGetAllUserChatToPlaces
} = require('../services/User');

const getMyProfile = async (req, res) => {
  try {
    const id = req.user.userId;
    const user = await getMyInfo(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.userId;
    const result = await uploadAvatarService(file, userId);
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
const uploadProfileController = async (req, res) => {
  try {
    const data = req.body;
    const { userId } = req.user;
    const result = await uploadProfile(userId, data);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const changePass = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;
    console.log(currentPassword, newPassword);
    const result = await changePassword(userId, currentPassword, newPassword);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const upgradeToProviderController = async (req, res) => {
  try {
    const { userId } = req.user;
    const data = req.body;
    const result = await upgradeToProvider(userId, data);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getStatsUser = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetStatsUser(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAllAccountAwaitConfirm = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetAllAccountUpgradeProvider(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const confirmUpgradeToProvider = async (req, res) => {
  try {
    const { role } = req.user;
    const { userId } = req.params;
    const result = await handleConfirmUpgradeToProvider(role, userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const rejectUpgradeToProvider = async (req, res) => {
  try {
    const { role } = req.user;
    const { userId } = req.params;
    const result = await handleRejectUpgradeToProvider(role, userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUser = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetAllUser(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAllSupplier = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetAllSupplier(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPlacesChat = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await getAllPlacesChat(userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllChatUserToProvider = async (req, res) => {
  try {
    const { userId } = req.user;
    const { placeId } = req.params;
    const result = await handleGetAllUserChatToPlaces(userId, placeId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  getMyProfile,
  uploadAvatar,
  uploadProfileController,
  changePass,
  upgradeToProviderController,
  getStatsUser,
  getAllAccountAwaitConfirm,
  confirmUpgradeToProvider,
  rejectUpgradeToProvider,
  getAllUser,
  getAllSupplier,
  getPlacesChat,
  getAllChatUserToProvider
};
