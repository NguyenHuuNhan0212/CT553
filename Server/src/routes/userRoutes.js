const { getUsers, getMyProfile } = require('../controllers/userController.js');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware.js');
router.get('/users', getUsers);
router.get('/my-profile', verifyToken, getMyProfile);
module.exports = router;
