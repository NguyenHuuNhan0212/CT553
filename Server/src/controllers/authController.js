const {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshTokenService
} = require('../services/Auth/index.js');
const registerUser = async (req, res) => {
  try {
    console.log(req.body);
    const result = await register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const loginUser = async (req, res) => {
  try {
    const result = await login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const forgotPass = async (req, res) => {
  try {
    const { email } = req.body;
    const resp = await forgotPassword(email);
    return res.status(200).json(resp);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
const resetPass = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const resp = await resetPassword(token, password);
    return res.status(200).json(resp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshTokenService(refreshToken);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
module.exports = {
  registerUser,
  loginUser,
  forgotPass,
  resetPass,
  refreshTokenController
};
