const BookingModel = require('../../models/Booking');
const PlaceModel = require('../../models/Place');
const PaymentModel = require('../../models/Payment');
const { nightsBetween, countBookedRooms } = require('../../utils/hotel');
const { isWithin1Hour } = require('../../utils/booking');

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
        serviceName: service.name,
        quantity: d.quantity || 1,
        priceAtBooking: service.price
      });

      totalPrice += service.price * (d.quantity || 1);
    }

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
        roomTypeName: roomType.name,
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
  const payment = await PaymentModel.findOne({ bookingId });
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
    payment,
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
  const booking = await BookingModel.findOne({
    _id: bookingId,
    userId,
    status: 'cancelled'
  });
  if (!booking) {
    throw new Error('Không được phép xóa đơn đặt ở trạng thái này.');
  } else {
    await BookingModel.findByIdAndDelete(bookingId);
    await PaymentModel.findOneAndDelete({ bookingId });
    return {
      message: 'Xóa booking thành công.'
    };
  }
};

const handleCancelBooking = async (userId, bookingId) => {
  const booking = await BookingModel.findOne({ userId, _id: bookingId }).lean();
  if (!booking) {
    throw new Error('Booking not found');
  } else {
    const payment = await PaymentModel.findOne({ bookingId });
    const isValidOffline =
      booking.status === 'confirmed' &&
      payment.status === 'pending' &&
      payment.method === 'offline';
    if (isValidOffline) {
      await BookingModel.findByIdAndUpdate(booking._id, {
        status: 'cancelled'
      });
      await PaymentModel.findOneAndDelete({ bookingId });
    } else if (!isValidOffline && isWithin1Hour(booking.createdAt)) {
      await BookingModel.findByIdAndUpdate(booking._id, {
        status: 'cancelled'
      });
      await PaymentModel.findOneAndUpdate(
        { bookingId },
        { status: 'refunded' }
      );
    } else {
      await BookingModel.findByIdAndUpdate(booking._id, {
        status: 'cancelled'
      });
    }
    return {
      message: 'handel cancel booking'
    };
  }
};

const getServiceBookingForPlace = async (userId) => {
  const places = await PlaceModel.find({ userId }).lean();
  let bookings = [];

  if (!places.length) {
    return { bookings };
  } else {
    const placeIds = places.map((p) => p._id);

    bookings = await BookingModel.find({ placeId: { $in: placeIds } })
      .populate('placeId', 'name')
      .populate('userId', 'fullName')
      .lean()
      .sort({ createdAt: -1 });

    const bookingIds = bookings.map((b) => b._id);
    const payments = await PaymentModel.find({
      bookingId: { $in: bookingIds }
    }).lean();

    const paymentMap = new Map(payments.map((p) => [String(p.bookingId), p]));

    const bookingsWithPayment = bookings.map((b) => {
      const p = paymentMap.get(String(b._id));
      return {
        ...b,
        paymentStatus: p ? p.status : 'chưa thanh toán',
        paymentMethod: p ? p.method : 'N/A'
      };
    });

    return {
      bookings: bookingsWithPayment
    };
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingDetail,
  deleteBooking,
  handleCancelBooking,
  getServiceBookingForPlace
};
