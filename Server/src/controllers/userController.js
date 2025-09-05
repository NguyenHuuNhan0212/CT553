const { getAllUsers } = require('../services/User');
const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = { getUsers };
