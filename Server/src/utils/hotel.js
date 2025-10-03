const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const BookingDetail = require('../models/BookingDetail');
function nightsBetween(checkIn, checkOut) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  // làm tròn xuống
  const diff = Math.floor((b - a) / msPerDay);
  if (diff === 0) {
    return 1;
  }
  return diff > 0 ? diff : 0;
}
function isOverlapping(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

async function countBookedRooms(roomTypeId, checkIn, checkOut) {
  const overlappingBookings = await Booking.find({
    checkInDate: { $lt: new Date(checkOut) },
    checkOutDate: { $gt: new Date(checkIn) },
    status: { $ne: 'cancelled' }
  }).select('_id');

  if (!overlappingBookings.length) return 0;

  const bookingIds = overlappingBookings.map((b) => b._id);

  const agg = await BookingDetail.aggregate([
    {
      $match: {
        bookingId: { $in: bookingIds },
        roomTypeId: new mongoose.Types.ObjectId(roomTypeId)
      }
    },
    { $group: { _id: '$roomTypeId', totalBooked: { $sum: '$quantity' } } }
  ]);

  return agg[0] && agg[0].totalBooked ? agg[0].totalBooked : 0;
}
module.exports = { nightsBetween, isOverlapping, countBookedRooms };
