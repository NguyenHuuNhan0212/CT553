const Booking = require('../models/Booking');
const mongoose = require('mongoose');

function nightsBetween(checkIn, checkOut) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(checkIn).setHours(0, 0, 0, 0);
  const end = new Date(checkOut).setHours(0, 0, 0, 0);
  const diff = Math.round((end - start) / msPerDay);
  return diff <= 0 ? 1 : diff;
}

function isOverlapping(aStart, aEnd, bStart, bEnd) {
  const aS = new Date(aStart),
    aE = new Date(aEnd),
    bS = new Date(bStart),
    bE = new Date(bEnd);
  return aS < bE && bS < aE;
}

async function countBookedRooms(roomTypeId, checkIn, checkOut) {
  if (!roomTypeId) {
    console.error(' roomTypeId bị thiếu:', roomTypeId);
    return 0;
  }
  const roomTypeObjId = new mongoose.Types.ObjectId(roomTypeId);

  const bookings = await Booking.aggregate([
    {
      $match: {
        checkInDate: { $lt: new Date(checkOut) },
        checkOutDate: { $gt: new Date(checkIn) },
        status: { $ne: 'cancelled' }
      }
    },
    { $unwind: '$bookingDetails' },
    {
      $match: {
        'bookingDetails.roomTypeId': roomTypeObjId
      }
    },
    {
      $group: {
        _id: '$bookingDetails.roomTypeId',
        totalBooked: { $sum: '$bookingDetails.quantity' }
      }
    }
  ]);

  return bookings[0]?.totalBooked || 0;
}

module.exports = { nightsBetween, isOverlapping, countBookedRooms };
