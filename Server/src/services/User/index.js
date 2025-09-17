const bcrypt = require('bcryptjs');
const UserModel = require('../../models/User');
const OwnerModel = require('../../models/OwnerInfo');
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
const changePassword = async (id, password, newPassword) => {
  const user = await UserModel.findById(id);

  if (!user) {
    throw new Error('Không tìm thấy người dùng.');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Mật khẩu cũ không đúng.');
  } else {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return {
      message: 'Đổi mật khẩu thành công.'
    };
  }
};

const upgradeToProvider = async (id, data) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new Error('Người dùng không tồn tại.');
  }
  const providerCheck = await OwnerModel.findOne({ userId: id });
  if (providerCheck && user.role === 'provider') {
    throw new Error('Bạn đã là nhà cung cấp. Không thể đăng ký được nữa.');
  } else if (providerCheck && user.role === 'user') {
    throw new Error('Bạn đã đăng ký. Vui lòng chờ Quản trị viên duyệt.');
  } else {
    const ownerInfo = new OwnerModel({
      userId: id,
      bankAccount: data.bankAccount,
      bankName: data.bankName,
      cardHolderName: data.cardHolderName,
      cardNumber: data.cardNumber
    });
    await ownerInfo.save();
    return {
      message: 'Đăng ký tài khoản nhà cung cấp thành công.'
    };
  }
};
module.exports = {
  getAllUsers,
  getMyInfo,
  uploadAvatarService,
  uploadProfile,
  changePassword,
  upgradeToProvider
};
