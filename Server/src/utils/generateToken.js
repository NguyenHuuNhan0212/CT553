const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'LUAN-VAN-TOT-NGHIEP',
    { expiresIn: '10s' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email
    },
    process.env.JWT_REFRESH_SECRET || 'LUAN-VAN-REFRESH-SECRET',
    { expiresIn: '7d' }
  );
};
module.exports = { generateToken, generateRefreshToken };
