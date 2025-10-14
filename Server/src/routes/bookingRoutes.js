const {
  createBookingController,
  getBookingsController,
  getBookingById,
  deletedBooking,
  cancelBooking,
  getServiceBookingsBySupplierId,
  deleteBookingForSupplier,
  confirmPayment,
  createInternalBookingController
} = require('../controllers/bookingController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router
  .post('/internal', verifyToken, createInternalBookingController)
  .post('/', verifyToken, createBookingController)
  .get('/supplier', verifyToken, getServiceBookingsBySupplierId)
  .get('/:bookingId', verifyToken, getBookingById)
  .get('/', verifyToken, getBookingsController)
  .patch('/confirm-payment/:bookingId', verifyToken, confirmPayment)
  .patch('/:bookingId', verifyToken, cancelBooking)
  .delete('/supplier/:bookingId', deleteBookingForSupplier)
  .delete('/:bookingId', verifyToken, deletedBooking);
module.exports = router;
