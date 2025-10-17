const {
  createItinerary,
  getAllItinerariesByUserId,
  getItineraryDetail,
  updateStatus,
  addPeopleAndPrice,
  deleteItinerary
} = require('../controllers/itineraryController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router
  .post('/', verifyToken, createItinerary)
  .get('/my-itinerary', verifyToken, getAllItinerariesByUserId)
  .get('/:itineraryId', getItineraryDetail)
  .patch('/price-people/:itineraryId', verifyToken, addPeopleAndPrice)
  .patch('/:itineraryId', verifyToken, updateStatus)
  .delete('/:itineraryId', verifyToken, deleteItinerary);

module.exports = router;
