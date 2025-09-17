const UserModel = require('../../models/User');

const getAllUsers = async () => {
  return await UserModel.find({}, '-password');
};
const getMyInfo = async (id) => {
  return await UserModel.findById(id, '-password');
};

const uploadAvatarService = async (file, userId) => {
  if (!file) {
    throw new Error('Không có file upload!');
  }
  const avatarUrl = `/uploads/${file.filename}`;
  await UserModel.findByIdAndUpdate(userId, { avatarUrl });
  return {
    message: 'Upload avatar thành công.',
    avatarUrl
  };
};
const uploadProfile = async (id, data) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new Error('Người dùng không tồn tại!');
  }
  const updateUser = await UserModel.findByIdAndUpdate(id, {
    fullName: data.fullName,
    email: data.email
  });
  return {
    message: 'Cập nhật thông tin thành công.',
    user: updateUser
  };
};
module.exports = { getAllUsers, getMyInfo, uploadAvatarService, uploadProfile };
