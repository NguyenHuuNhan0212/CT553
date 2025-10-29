const {
  getStatsPlaceByType,
  getUsersSevenDaysNewest
} = require('../controllers/statsForAdmin');

const verifyToken = require('../middlewares/authMiddleware');
const express = require('express');
const router = express.Router();
router
  .get('/admin/place-by-type', verifyToken, getStatsPlaceByType)
  .get('/admin/users-newest', verifyToken, getUsersSevenDaysNewest);
module.exports = router;
