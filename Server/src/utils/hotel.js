const Booking = require('../models/Booking');
const mongoose = require('mongoose');

function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const startUTC = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((endUTC - startUTC) / msPerDay) + 1;
  return diffDays <= 0 ? 1 : diffDays;
}

function isOverlapping(aStart, aEnd, bStart, bEnd) {
  const aS = new Date(aStart);
  const aE = new Date(aEnd);
  const bS = new Date(bStart);
  const bE = new Date(bEnd);
  return aS <= bE && bS <= aE;
}

async function countBookedRooms(placeId, roomTypeId, checkIn, checkOut) {
  if (!roomTypeId) {
    console.error('❌ Thiếu roomTypeId:', roomTypeId);
    return 0;
  }

  const placeObjId = new mongoose.Types.ObjectId(placeId);
  const roomTypeObjId = new mongoose.Types.ObjectId(roomTypeId);

  const bookings = await Booking.aggregate([
    {
      $match: {
        placeId: placeObjId,
        status: { $ne: 'cancelled' },
        checkInDate: { $lt: new Date(checkOut) },
        checkOutDate: { $gt: new Date(checkIn) }
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
