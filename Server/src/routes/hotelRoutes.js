const {
  addHotelController,
  getInfoOneHotel,
  getAll,
  getHotelNearPlace,
  deleteHotel,
  updateStatusActive,
  updateHotelController,
  getHotelRelativeByAddress
} = require('../controllers/hotelController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
router.post('/', verifyToken, upload.array('images'), addHotelController);
router.get('/near-place', getHotelNearPlace);
router.get('/relative', getHotelRelativeByAddress);
router.get('/:hotelId', getInfoOneHotel);
router.patch('/update-status-active/:hotelId', verifyToken, updateStatusActive);
router.put(
  '/:hotelId',
  verifyToken,
  upload.array('images'),
  updateHotelController
);
router.delete('/:hotelId', verifyToken, deleteHotel);
router.get('/', getAll);
module.exports = router;
