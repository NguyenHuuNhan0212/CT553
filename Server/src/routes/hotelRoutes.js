const {
  addHotelController,
  getInfoOneHotel,
  getAll,
  getHotelRelativeByTypeAndAddress,
  deleteHotel,
  updateStatusActive,
  updateHotelController
} = require('../controllers/hotelController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
router.post('/', verifyToken, upload.array('images'), addHotelController);
router.get('/relative', getHotelRelativeByTypeAndAddress);
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
