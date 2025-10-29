const {
  getStatsPlaceByType,
  getUsersSevenDaysNewest,
  getFivePlacesPopular
} = require('../controllers/statsForAdmin');

const verifyToken = require('../middlewares/authMiddleware');
const express = require('express');
const router = express.Router();
router
  .get('/admin/place-by-type', verifyToken, getStatsPlaceByType)
  .get('/admin/users-newest', verifyToken, getUsersSevenDaysNewest)
  .get('/admin/five-places-popular', verifyToken, getFivePlacesPopular);
module.exports = router;
