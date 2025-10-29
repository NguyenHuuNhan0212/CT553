const {
  getMyProfile,
  uploadAvatar,
  uploadProfileController,
  changePass,
  upgradeToProviderController,
  getStatsUser,
  getAllAccountAwaitConfirm,
  confirmUpgradeToProvider,
  rejectUpgradeToProvider,
  getAllUser
} = require('../controllers/userController.js');
const upload = require('../middlewares/upload.js');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware.js');
router
  .get('/users/upgrade', verifyToken, getAllAccountAwaitConfirm)
  .get('/my-profile', verifyToken, getMyProfile)
  .get('/users/stats', verifyToken, getStatsUser)
  .get('/users', verifyToken, getAllUser)
  .post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar)
  .patch('/update-profile', verifyToken, uploadProfileController)
  .post('/users/upgrade/confirm/:userId', verifyToken, confirmUpgradeToProvider)
  .post('/users/upgrade/reject/:userId', verifyToken, rejectUpgradeToProvider)
  .post('/change-password', verifyToken, changePass)
  .post('/upgrade-to-provider', verifyToken, upgradeToProviderController);
module.exports = router;
