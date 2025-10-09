require('dotenv').config();
const UserModel = require('../../models/User.js');
const TokenModel = require('../../models/Token.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../../utils/nodemailer.js');
const {
  generateRefreshToken,
  generateToken
} = require('../../utils/generateToken.js');
const register = async (data) => {
  if (data.email && data.password && data.fullName && data.phone) {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('Email đã đăng ký tài khoản.');
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    data.password = passwordHash;
    const newUser = new UserModel(data);
    await newUser.save();
    return { message: 'User registered successfully' };
  } else {
    throw new Error('Missing required fields');
  }
};
const login = async (data) => {
  if (data.identify && data.password) {
    const user = await UserModel.findOne({
      $or: [{ email: data.identify }, { phone: data.identify }]
    });

    if (!user) {
      throw new Error('Email hoặc số điện thoại không đúng');
    }
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không đúng.');
    }
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    await TokenModel.findOneAndUpdate(
      {
        userId: user._id,
        type: 'refreshToken'
      },
      {
        token: refreshToken
      },
      {
        upsert: true
      }
    );
    return { refreshToken, token, message: 'Login successful' };
  } else {
    throw new Error('Missing required fields');
  }
};
const forgotPassword = async (email) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new Error('Email không tồn tại');
  }
  await TokenModel.deleteMany({ userId: user._id, type: 'resetPassword' });
  const newToken = crypto.randomBytes(32).toString('hex');

  await TokenModel.create({
    userId: user._id,
    token: newToken,
    type: 'resetPassword',
    expiry: new Date(Date.now() + 15 * 60 * 1000) // hanj 15 phuts
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${newToken}`;

  await sendMail({
    to: user.email,
    subject: 'Đặt lại mật khẩu',
    html: `<p>Nhấn vào link sau để đổi mật khẩu (có hiệu lực 15 phút):</p>
             <a href="${resetUrl}">${resetUrl}</a>`
  });

  return {
    message: 'Sended Reset Password Link Successfully!'
  };
};

const resetPassword = async (token, password) => {
  const tokenDoc = await TokenModel.findOne({
    token,
    type: 'resetPassword',
    expiry: { $gt: Date.now() }
  });
  if (!tokenDoc) {
    throw new Error('Token không hợp lệ hoặc hết hạn');
  }
  const user = await UserModel.findById(tokenDoc.userId);
  if (!user) {
    throw new Error('Người tìm thấy người dùng');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  await user.save();

  await TokenModel.deleteOne({ _id: tokenDoc._id });
  return {
    message: 'Reset Password successfully!'
  };
};

const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Thiếu refresh token');
  }

  const tokenDoc = await TokenModel.findOne({
    token: refreshToken,
    type: 'refreshToken'
  });

  if (!tokenDoc) {
    throw new Error('Refresh token không tồn tại hoặc đã bị thu hồi');
  }

  try {
    // 2. Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'LUAN-VAN-REFRESH-SECRET'
    );

    // 3. Tìm user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    // 4. Tạo access token mới
    const newAccessToken = generateToken(user);

    return {
      token: newAccessToken,
      message: 'Refresh token thành công'
    };
  } catch (err) {
    throw new Error('Refresh token không hợp lệ hoặc hết hạn');
  }
};
module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshTokenService
};
