const UserModel = require('../../models/User');

const getAllUsers = async () => {
  return await UserModel.find({}, '-password');
};
const getMyInfo = async (userId) => {
  return await UserModel.findOne({ userId }, '-password');
};
module.exports = { getAllUsers, getMyInfo };
