const {
  getStatsPlaceByType,
  getUsersSevenDaysNewest,
  getFivePlacesPopular,
  getFivePlacesHaveInItinerary,
  getStatsRevenueAndTransaction
} = require('../controllers/statsForAdmin');

const verifyToken = require('../middlewares/authMiddleware');
const express = require('express');
const router = express.Router();
router
  .get('/admin/place-by-type', verifyToken, getStatsPlaceByType)
  .get('/admin/users-newest', verifyToken, getUsersSevenDaysNewest)
  .get('/admin/five-places-booking', verifyToken, getFivePlacesPopular)
  .get(
    '/admin/five-places-itinerary',
    verifyToken,
    getFivePlacesHaveInItinerary
  )
  .get(
    '/admin/revenue-and-transaction',
    verifyToken,
    getStatsRevenueAndTransaction
  );
module.exports = router;
