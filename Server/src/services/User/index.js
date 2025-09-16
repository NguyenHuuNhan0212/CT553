const UserModel = require('../../models/User');

const getAllUsers = async () => {
  return await UserModel.find({}, '-password');
};
const getMyInfo = async (id) => {
  return await UserModel.findById(id, '-password');
};
module.exports = { getAllUsers, getMyInfo };
