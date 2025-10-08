const {
  createBookingController,
  getBookingsController,
  getBookingById,
  deletedBooking,
  cancelBooking,
  getServiceBookingsBySupplierId
} = require('../controllers/bookingController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router
  .post('/', verifyToken, createBookingController)
  .get('/supplier', verifyToken, getServiceBookingsBySupplierId)
  .get('/:bookingId', verifyToken, getBookingById)
  .get('/', verifyToken, getBookingsController)
  .patch('/:bookingId', verifyToken, cancelBooking)
  .delete('/:bookingId', verifyToken, deletedBooking);
module.exports = router;
