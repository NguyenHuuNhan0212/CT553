const {
  createBookingController,
  getBookingsController,
  getBookingById
} = require('../controllers/bookingController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router.post('/', verifyToken, createBookingController);
router.get('/:bookingId', verifyToken, getBookingById);
router.get('/', verifyToken, getBookingsController);
module.exports = router;
