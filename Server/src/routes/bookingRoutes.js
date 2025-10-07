const {
  createBookingController,
  getBookingsController,
  getBookingById,
  deletedBooking,
  cancelBooking
} = require('../controllers/bookingController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router.post('/', verifyToken, createBookingController);
router.get('/:bookingId', verifyToken, getBookingById);
router.get('/', verifyToken, getBookingsController);
router.patch('/:bookingId', verifyToken, cancelBooking);
router.delete('/:bookingId', verifyToken, deletedBooking);
module.exports = router;
