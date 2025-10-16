const {
  createItinerary,
  getAllItinerariesByUserId
} = require('../controllers/itineraryController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router
  .post('/', verifyToken, createItinerary)
  .get('/my-itinerary', verifyToken, getAllItinerariesByUserId);

module.exports = router;
