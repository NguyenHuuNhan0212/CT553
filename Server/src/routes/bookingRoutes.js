const {
  createBookingController,
  getBookingsController,
  getBookingById,
  deletedBooking,
  cancelBooking,
  getServiceBookingsBySupplierId,
  deleteBookingForSupplier,
  confirmPayment,
  createInternalBookingController,
  cancelBookingForSupplier
} = require('../controllers/bookingController');

const {
  getStats,
  getStatsByLocation,
  getRevenueByDate
} = require('../controllers/statsBookingForProviderController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router
  .post('/internal', verifyToken, createInternalBookingController)
  .post('/', verifyToken, createBookingController)
  .get('/stats', verifyToken, getStats)
  .get('/revenue/by-location', verifyToken, getStatsByLocation)
  .get('/revenue/by-date', verifyToken, getRevenueByDate)
  .get('/supplier', verifyToken, getServiceBookingsBySupplierId)
  .get('/:bookingId', verifyToken, getBookingById)
  .get('/', verifyToken, getBookingsController)
  .patch('/confirm-payment/:bookingId', verifyToken, confirmPayment)
  .patch('/supplier/:bookingId', verifyToken, cancelBookingForSupplier)
  .patch('/:bookingId', verifyToken, cancelBooking)
  .delete('/supplier/:bookingId', deleteBookingForSupplier)
  .delete('/:bookingId', verifyToken, deletedBooking);
module.exports = router;
