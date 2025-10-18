const {
  createItinerary,
  getAllItinerariesByUserId,
  getItineraryDetail,
  updateStatus,
  addPeopleAndPrice,
  deleteItinerary,
  getAllItineraryTemplate
} = require('../controllers/itineraryController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router
  .post('/', verifyToken, createItinerary)
  .get('/template', getAllItineraryTemplate)
  .get('/my-itinerary', verifyToken, getAllItinerariesByUserId)
  .get('/:itineraryId', getItineraryDetail)
  .patch('/price-people/:itineraryId', verifyToken, addPeopleAndPrice)
  .patch('/:itineraryId', verifyToken, updateStatus)
  .delete('/:itineraryId', verifyToken, deleteItinerary);

module.exports = router;
