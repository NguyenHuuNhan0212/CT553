const { get } = require('mongoose');
const { getAllUsers, getMyInfo } = require('../services/User');
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
    const userId = req.user.userId;
    const user = await getMyInfo(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = { getUsers, getMyProfile };
