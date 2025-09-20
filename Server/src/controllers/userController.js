const {
  getAllUsers,
  getMyInfo,
  uploadAvatarService,
  uploadProfile,
  changePassword,
  upgradeToProvider
} = require('../services/User');
const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
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
module.exports = {
  getUsers,
  getMyProfile,
  uploadAvatar,
  uploadProfileController,
  changePass,
  upgradeToProviderController
};
