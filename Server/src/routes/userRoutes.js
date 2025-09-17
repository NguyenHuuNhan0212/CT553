const {
  getUsers,
  getMyProfile,
  uploadAvatar,
  uploadProfileController
} = require('../controllers/userController.js');
const upload = require('../middlewares/upload.js');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware.js');
router.get('/users', getUsers);
router.get('/my-profile', verifyToken, getMyProfile);
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);
router.patch('/update-profile', verifyToken, uploadProfileController);
module.exports = router;
