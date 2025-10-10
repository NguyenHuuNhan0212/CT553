const {
  addPlace,
  getInfoOnePlace,
  getAll,
  getPlaceRelativeByTypeAndAddress,
  deletePlace,
  updateStatusActive,
  updatePlace,
  getAllByUserId,
  getHotelsNear,
  getPlacesPopularController
} = require('../controllers/placeController');
const {
  getSearchHotels,
  getHotelDetailByReqUser
} = require('../controllers/hotelController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
router
  .post('/', verifyToken, upload.array('images'), addPlace)
  .get('/my-services', verifyToken, getAllByUserId)
  .get('/hotels/search', getSearchHotels)
  .get('/hotel/:hotelId', getHotelDetailByReqUser)
  .get('/relative', getPlaceRelativeByTypeAndAddress)
  .get('/popular', getPlacesPopularController)
  .get('/:placeId', getInfoOnePlace)
  .patch('/update-status-active/:placeId', verifyToken, updateStatusActive)
  .put('/:placeId', verifyToken, upload.array('images'), updatePlace)
  .delete('/:placeId', verifyToken, deletePlace)
  .get('/', getAll);
module.exports = router;
