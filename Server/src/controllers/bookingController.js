const {
  createBooking,
  getBookings,
  getBookingDetail,
  deleteBooking,
  handleCancelBooking,
  getServiceBookingForPlace
} = require('../services/Booking');

const createBookingController = async (req, res) => {
  try {
    const { userId } = req.user;
    const data = req.body;
    const result = await createBooking(userId, data);
    return res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getBookingsController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getBookings(userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getBookingById = async (req, res) => {
  try {
    const { userId } = req.user;
    const { bookingId } = req.params;
    const result = await getBookingDetail(userId, bookingId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const deletedBooking = async (req, res) => {
  try {
    const { userId } = req.user;
    const { bookingId } = req.params;
    const result = await deleteBooking(userId, bookingId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { userId } = req.user;
    const { bookingId } = req.params;
    const result = await handleCancelBooking(userId, bookingId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getServiceBookingsBySupplierId = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await getServiceBookingForPlace(userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  createBookingController,
  getBookingsController,
  getBookingById,
  deletedBooking,
  cancelBooking,
  getServiceBookingsBySupplierId
};
