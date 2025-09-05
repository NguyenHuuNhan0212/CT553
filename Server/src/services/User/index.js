const UserModel = require('../../models/User');

const getAllUsers = async () => {
  return await UserModel.find({}, '-password');
};
module.exports = { getAllUsers };
