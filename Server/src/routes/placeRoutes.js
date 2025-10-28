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
  getPlacesPopularController,
  addPlaceFavorite,
  removePlaceFavorite,
  getPlacesFavorite,
  getStatsPlace,
  getPlacesAwaitConfirm,
  approvePlace,
  getAllAdmin,
  rejectPlace
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
  .post('/favorite', verifyToken, addPlaceFavorite)
  .post('/', verifyToken, upload.array('images'), addPlace)
  .get('/my-services', verifyToken, getAllByUserId)
  .get('/hotels/search', getSearchHotels)
  .get('/near-hotels', getHotelsNear)
  .get('/hotel/:hotelId', getHotelDetailByReqUser)
  .get('/relative', getPlaceRelativeByTypeAndAddress)
  .get('/popular', getPlacesPopularController)
  .get('/favorite', verifyToken, getPlacesFavorite)
  .get('/stats', verifyToken, getStatsPlace)
  .get('/await-approve', verifyToken, getPlacesAwaitConfirm)
  .get('/admin', verifyToken, getAllAdmin)
  .get('/:placeId', getInfoOnePlace)
  .get('/', getAll)
  .patch('/update-status-active/:placeId', verifyToken, updateStatusActive)
  .patch('/approve/:placeId', verifyToken, approvePlace)
  .patch('/reject/:placeId', verifyToken, rejectPlace)
  .put('/:placeId', verifyToken, upload.array('images'), updatePlace)
  .delete('/favorite/:placeId', verifyToken, removePlaceFavorite)
  .delete('/:placeId', verifyToken, deletePlace);

module.exports = router;
