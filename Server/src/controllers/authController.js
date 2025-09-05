const { register, login } = require('../services/Auth/index.js');
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
module.exports = { registerUser, loginUser };
