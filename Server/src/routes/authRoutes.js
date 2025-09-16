const {
  registerUser,
  loginUser,
  forgotPass,
  resetPass,
  refreshTokenController
} = require('../controllers/authController.js');
const express = require('express');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPass);
router.post('/reset-password/:token', resetPass);
router.post('/refresh-token', refreshTokenController);
module.exports = router;
