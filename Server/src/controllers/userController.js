const {
  getAllUsers,
  getMyInfo,
  uploadAvatarService,
  uploadProfile
} = require('../services/User');
const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.userId;
    const result = await uploadAvatarService(file, userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
const uploadProfileController = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const { userId } = req.user;
    const result = await uploadProfile(userId, { fullName, email });
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
module.exports = {
  getUsers,
  getMyProfile,
  uploadAvatar,
  uploadProfileController
};
