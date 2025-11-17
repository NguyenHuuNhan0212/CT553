const bcrypt = require('bcryptjs');
const UserModel = require('../../models/User');
const OwnerModel = require('../../models/Supplier');
const MessageModel = require('../../models/Message');
const PlaceModel = require('../../models/Place');
const { sendMail } = require('../../utils/nodemailer');
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
    .select('_id fullName email phone createdAt role')
    .lean();

  const owners = await OwnerModel.find({
    isApprove: false
  })
    .select(
      'userId bankName bankAccount cardHolderName cardNumber createdAt isApprove'
    )
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
        role: user?.role,
        registerDate: user?.createdAt,
        bankName: owner.bankName,
        isApprove: owner.isApprove,
        bankAccount: owner.bankAccount,
        upgradeDate: owner.createdAt,
        cardHolderName: owner.cardHolderName,
        cardNumber: owner.cardNumber
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
const handleConfirmUpgradeToProvider = async (role, userId) => {
  if (role !== 'admin') {
    throw new Error('Bạn không có quyền thực hiện hành động này.');
  }
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại.');
  }
  if (user.role === 'provider') {
    throw new Error('Người dùng đã là nhà cung cấp.');
  }
  const ownerInfo = await OwnerModel.findOne({ userId });
  if (!ownerInfo) {
    throw new Error('Không tìm thấy thông tin đăng ký nhà cung cấp.');
  }
  ownerInfo.isApprove = true;
  await ownerInfo.save();
  user.role = 'provider';
  await user.save();
  sendMail({
    to: user.email,
    subject: 'Xác nhận nâng cấp nhà cung cấp thành công',
    html: `<p>Chào ${user.fullName},</p>
            <p>Tài khoản của bạn đã được nâng cấp lên nhà cung cấp thành công. Bây giờ bạn có thể bắt đầu thêm và quản lý các địa điểm du lịch trên nền tảng của chúng tôi.</p>
            <p>Chúc bạn có những trải nghiệm tuyệt vời!</p>
            <p>Trân trọng,</p>
            <p>Đội ngũ Vigo Travel</p>`
  });
  return {
    message: 'Xác nhận nâng cấp nhà cung cấp thành công.'
  };
};

const handleRejectUpgradeToProvider = async (role, userId) => {
  if (role !== 'admin') {
    throw new Error('Bạn không có quyền thực hiện hành động này.');
  }
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại.');
  }
  const ownerInfo = await OwnerModel.findOne({ userId });
  if (!ownerInfo) {
    throw new Error('Không tìm thấy thông tin đăng ký nhà cung cấp.');
  }
  await OwnerModel.deleteOne({ userId });
  sendMail({
    to: user.email,
    subject: 'Từ chối nâng cấp nhà cung cấp',
    html: `<p>Chào ${user.fullName},</p>
            <p>Chúng tôi rất tiếc phải thông báo rằng yêu cầu nâng cấp nhà cung cấp của bạn đã bị từ chối. Nếu bạn có thắc mắc hoặc cần thêm thông tin, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
            <p>Trân trọng,</p>  
            <p>Đội ngũ Vigo Travel</p>`
  });
  return {
    message: 'Đã từ chối nâng cấp nhà cung cấp thành công.'
  };
};

const handleGetAllUser = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền truy cập.');
  }
  const users = await UserModel.find({ role: { $ne: 'admin' } })
    .select('_id fullName email phone createdAt role')
    .sort({ createdAt: -1 })
    .lean();
  const owners = await OwnerModel.find({ isApprove: true })
    .select(
      'userId bankName bankAccount cardHolderName cardNumber createdAt isApprove'
    )
    .populate('userId', '_id')
    .lean();
  const mergedUsers = users.map((user) => {
    const ownerInfo = owners.find(
      (o) => o.userId?._id.toString() === user._id.toString()
    );

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      registerDate: user.createdAt,
      ...(ownerInfo
        ? {
            isProviderApproved: true,
            bankName: ownerInfo.bankName,
            bankAccount: ownerInfo.bankAccount,
            cardHolderName: ownerInfo.cardHolderName,
            cardNumber: ownerInfo.cardNumber
          }
        : {
            isProviderApproved: false
          })
    };
  });

  return mergedUsers;
};

const handleGetAllSupplier = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền thực hiện.');
  }

  const suppliers = await UserModel.find({ role: 'provider' }).select(
    'fullName'
  );

  return suppliers;
};

const getAllPlacesChat = async (userId) => {
  let placeIds = await MessageModel.distinct('placeId', { sender: userId });

  placeIds = await PlaceModel.find({
    _id: { $in: placeIds },
    userId: { $ne: userId }
  }).distinct('_id');
  const places = await PlaceModel.find({ _id: { $in: placeIds } }).lean();

  const result = await Promise.all(
    places.map(async (place) => {
      const unread = await MessageModel.countDocuments({
        receiver: userId,
        placeId: place._id,
        isRead: false
      });

      return {
        ...place,
        unread
      };
    })
  );

  return result;
};

const handleGetAllUserChatToPlaces = async (userId, placeId) => {
  const userIds = await MessageModel.distinct('sender', {
    receiver: userId,
    placeId
  });
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select('-password')
    .lean();
  const result = await Promise.all(
    users.map(async (user) => {
      const unread = await MessageModel.countDocuments({
        sender: user._id,
        receiver: userId,
        placeId: placeId,
        isRead: false
      });

      return {
        ...user,
        unread
      };
    })
  );
  return result;
};
module.exports = {
  getMyInfo,
  uploadAvatarService,
  uploadProfile,
  changePassword,
  upgradeToProvider,
  handleGetStatsUser,
  handleGetAllAccountUpgradeProvider,
  handleConfirmUpgradeToProvider,
  handleRejectUpgradeToProvider,
  handleGetAllUser,
  handleGetAllSupplier,
  getAllPlacesChat,
  handleGetAllUserChatToPlaces
};
