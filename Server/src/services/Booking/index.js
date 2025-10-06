const BookingModel = require('../../models/Booking');
const PlaceModel = require('../../models/Place');
const { nightsBetween, countBookedRooms } = require('../../utils/hotel');

const createBooking = async (userId, data) => {
  const { placeId, checkInDate, checkOutDate, details } = data;
  if (!placeId) throw new Error('Thiếu thông tin địa điểm.');
  if (!details || details.length === 0)
    throw new Error('Chưa chọn phòng hoặc dịch vụ.');

  const checkIn = new Date(checkInDate);
  checkIn.setHours(0, 0, 0, 0);

  const checkOut = new Date(checkOutDate);
  checkOut.setHours(23, 59, 59, 999);
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) throw new Error('Ngày check-out phải sau ngày check-in.');
  const place = await PlaceModel.findById(placeId).lean();
  if (!place) throw new Error('Không tìm thấy địa điểm.');

  const bookingDetails = [];
  let totalPrice = 0;
  for (const d of details) {
    // 📌 Dịch vụ
    if (d.serviceId) {
      const service = place.services.find(
        (s) => String(s._id) === String(d.serviceId)
      );
      if (!service) throw new Error('Dịch vụ không tồn tại trong địa điểm.');

      bookingDetails.push({
        serviceId: service._id,
        quantity: d.quantity || 1,
        priceAtBooking: service.price
      });

      totalPrice += service.price * (d.quantity || 1);
    }

    // 📌 Loại phòng
    if (d.roomTypeId) {
      const roomType = place.hotelDetail?.roomTypes.find(
        (r) => String(r._id) === String(d.roomTypeId)
      );
      if (!roomType)
        throw new Error('Loại phòng không tồn tại trong khách sạn này.');

      const booked = await countBookedRooms(
        placeId,
        roomType._id,
        checkIn,
        checkOut
      );
      const available = roomType.totalRooms - booked;

      if (available <= 0) {
        throw new Error(`Phòng loại "${roomType.name}" đã hết.`);
      }
      if (available < (d.quantity || 1)) {
        throw new Error(
          `Không đủ phòng loại "${roomType.name}". Chỉ còn ${available}.`
        );
      }

      bookingDetails.push({
        roomTypeId: roomType._id,
        quantity: d.quantity || 1,
        priceAtBooking: roomType.pricePerNight
      });

      totalPrice += roomType.pricePerNight * nights * (d.quantity || 1);
    }
  }

  const booking = await BookingModel.create({
    userId,
    placeId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    totalPrice: totalPrice,
    status: 'pending',
    bookingDetails
  });

  return { booking, message: 'Đặt chỗ thành công.' };
};

const getBookings = async (userId) => {
  const bookings = await BookingModel.find({ userId })
    .populate('placeId', 'name type address')
    .sort({ createdAt: -1 });

  return bookings.map((b) => {
    const placeName = b.placeId?.name || 'Không xác định';
    const placeType = b.placeId?.type;
    const serviceName =
      placeType === 'hotel'
        ? 'Khách sạn, nhà nghĩ'
        : placeType === 'restaurant'
        ? 'Nhà hàng, quán ăn'
        : placeType === 'cafe'
        ? 'Quán cafe'
        : 'Địa điểm du lịch';

    return { ...b.toObject(), placeName, serviceName };
  });
};

const getBookingDetail = async (userId, bookingId) => {
  const booking = await BookingModel.findOne({ _id: bookingId, userId })
    .populate('userId', 'name email')
    .populate('placeId', 'name type address hotelDetail services')
    .lean();
  if (!booking) {
    throw new Error('Không tìm thấy booking');
  }
  const place = booking.placeId;

  const bookingDetails = booking.bookingDetails.map((detail) => {
    let roomTypeName = null;
    let serviceName = null;

    if (detail.roomTypeId) {
      const roomType = place.hotelDetail?.roomTypes.find(
        (r) => r._id.toString() === detail.roomTypeId.toString()
      );
      if (roomType) {
        roomTypeName = roomType.name;
      }
    }
    if (detail.serviceId) {
      const service = place.services.find(
        (s) => s._id.toString() === detail.serviceId.toString()
      );
      if (service) {
        serviceName = service.name;
      }
    }
    return {
      ...detail,
      serviceName,
      roomTypeName
    };
  });
  const result = {
    bookingId,
    user: booking.userId,
    place: {
      _id: place._id,
      name: place.name,
      type: place.type,
      address: place.address
    },
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    totalPrice: booking.totalPrice,
    status: booking.status,
    bookingDetails
  };
  return result;
};

const deleteBooking = async (userId, bookingId) => {
  const booking = await BookingModel.findOne({ _id: bookingId, userId });
  if (!booking) {
    throw new Error('Đơn đặt không tồn tại.');
  }
  if (booking.status === 'pending') {
    throw new Error('Đơn đặt đang trong giai đoạn ');
  }
};
module.exports = { createBooking, getBookings, getBookingDetail };
