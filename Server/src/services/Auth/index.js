const UserModel = require('../../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const register = async (data) => {
  if (data.email && data.password && data.fullName) {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('Email already in use');
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
  if (data.email && data.password) {
    const user = await UserModel.findOne({ email: data.email });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }
    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'LUAN-VAN-TOT-NGHIEP',
      { expiresIn: '1h' }
    );
    return { token, message: 'Login successful' };
  } else {
    throw new Error('Missing required fields');
  }
};
module.exports = { register, login };
