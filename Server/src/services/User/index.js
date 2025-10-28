const bcrypt = require('bcryptjs');
const UserModel = require('../../models/User');
const OwnerModel = require('../../models/Supplier');
const getMyInfo = async (id) => {
  const user = await UserModel.findById(id, '-password').lean();
  if (user && user.role === 'provider') {
    const ownerInfo = await OwnerModel.findOne({ userId: user._id }).lean();
    return { ...ownerInfo, ...user };
  } else {
    return user;
  }
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
  let updateProvider = null;

  const checkPhone = await UserModel.findOne({
    phone: data.phone,
    _id: { $ne: user._id }
  });

  if (checkPhone) {
    throw new Error('Số điện thoại đã tồn tại.');
  }
  if (user.role === 'provider') {
    updateProvider = await OwnerModel.findOneAndUpdate(
      { userId: user._id },
      {
        bankAccount: data.bankAccount,
        bankName: data.bankName,
        cardHolderName: data.cardHolderName,
        cardNumber: data.cardNumber
      },
      { new: true }
    );
  }

  const updateUser = await UserModel.findByIdAndUpdate(
    id,
    { fullName: data.fullName, email: data.email, phone: data.phone },
    { new: true }
  ).lean();

  return {
    message: 'Cập nhật thông tin thành công.',
    user: {
      ...updateUser,
      ...(updateProvider ? { ownerInfo: updateProvider } : {})
    }
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
const handleGetStatsUser = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền.');
  }
  const users = await UserModel.find({ role: { $ne: 'admin' } }).lean();
  const userGroupByRole = await UserModel.aggregate([
    {
      $match: {
        role: { $ne: 'admin' }
      }
    },
    {
      $group: {
        _id: '$role',
        totalUser: { $sum: 1 }
      }
    }
  ]);
  return {
    totalUser: users?.length || 0,
    userGroupByRole
  };
};

const handleGetAllAccountUpgradeProvider = async (role) => {
  if (role !== 'admin') {
    throw new Error('Bạn không có quyền truy cập.');
  }

  const users = await UserModel.find({ role: 'user' })
    .select('_id fullName email phone createdAt')
    .lean();

  const owners = await OwnerModel.find({
    isApprove: false,
    $expr: { $eq: ['$createdAt', '$updatedAt'] }
  })
    .select('userId bankName bankAccount createdAt')
    .populate('userId', '_id fullName email phone createdAt')
    .lean();

  const mergedList = owners.map((owner) => {
    const user = users.find(
      (u) => u._id.toString() === owner.userId._id.toString()
    );
    if (user) {
      return {
        _id: user?._id,
        fullName: user?.fullName,
        email: user?.email,
        phone: user?.phone,
        registerDate: user?.createdAt,
        bankName: owner.bankName,
        bankAccount: owner.bankAccount,
        upgradeDate: owner.createdAt
      };
    } else {
      return null;
    }
  });
  const total = mergedList.length ? mergedList.filter((m) => m !== null) : [];
  return {
    total: total.length || 0,
    usersUpgrade: total
  };
};

module.exports = {
  getMyInfo,
  uploadAvatarService,
  uploadProfile,
  changePassword,
  upgradeToProvider,
  handleGetStatsUser,
  handleGetAllAccountUpgradeProvider
};
