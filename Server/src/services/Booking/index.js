// const BookingModel = require('../../models/Booking');
// const BookingDetailModel = require('../../models/BookingDetail');
// const RoomTypeModel = require('../../models/RoomType');
// const ServiceModel = require('../../models/Service');
// const { nightsBetween, countBookedRooms } = require('../../utils/hotel');

// const createBooking = async (userId, data) => {
//   console.log(data);
//   const { checkInDate, checkOutDate, details } = data;
//   const nights = nightsBetween(checkInDate, checkOutDate);
//   if (nights < 0) {
//     throw new Error('Ngày check-out phải sau ngày check-in');
//   }
//   if (!details || details.length === 0) {
//     throw new Error('Chưa chọn phòng/dịch vụ.');
//   }
//   const providerSet = new Set();
//   let totalPrice = 0;
//   for (const d of details) {
//     if (d?.serviceId) {
//       const service = await ServiceModel.findById(d.serviceId).lean();
//       if (!service) throw new Error('Dịch vụ không tồn tại.');
//       // check de them service cua place cu the
//       if (service.placeId) {
//         providerSet.add(String(service.placeId));
//       } else if (service.hotelId) {
//         providerSet.add(String(service.hotelId));
//       }

//       totalPrice += service.price * d.quantity;
//     } else {
//       const roomType = await RoomTypeModel.findById(d.roomTypeId).lean();
//       if (!roomType) throw new Error('Phòng không tồn tại.');

//       providerSet.add(String(roomType.hotelId));

//       // Check số lượng phòng còn trống
//       const booked = await countBookedRooms(
//         roomType._id,
//         checkInDate,
//         checkOutDate
//       );
//       const available = roomType.totalRooms - booked;
//       if (available < d.quantity) {
//         throw new Error(`Phòng không đủ. Chỉ còn ${available}`);
//       }

//       totalPrice += roomType.pricePerNight * nights * d.quantity;
//     }
//   }
//   if (providerSet.size > 1) {
//     throw new Error('Chỉ được đặt của 1 nhà cung cấp.');
//   }
//   const booking = await BookingModel.create({
//     userId,
//     checkInDate,
//     checkOutDate,
//     totalPrice,
//     status: 'pending'
//   });
//   for (const d of details) {
//     await BookingDetailModel.create({
//       bookingId: booking._id,
//       roomTypeId: d.roomTypeId || null,
//       serviceId: d.serviceId || null,
//       quantity: d.quantity,
//       priceAtBooking: d.roomTypeId
//         ? (
//             await RoomTypeModel.findById(d.roomTypeId)
//           ).pricePerNight
//         : (
//             await ServiceModel.findById(d.serviceId)
//           ).price
//     });
//   }
//   return {
//     booking,
//     message: 'Đặt dịch vụ thành công'
//   };
// };
// const getBookings = async (userId) => {
//   const bookings = await BookingModel.find({ userId }).sort({ createdAt: -1 });

//   if (!bookings.length) return [];

//   const result = await Promise.all(
//     bookings.map(async (b) => {
//       const bookingDetail = await BookingDetailModel.findOne({
//         bookingId: b._id
//       });

//       let placeName = null;
//       let serviceName = null;
//       if (bookingDetail?.roomTypeId) {
//         const roomType = await RoomTypeModel.findById(
//           bookingDetail.roomTypeId
//         ).populate('hotelId', 'name');
//         serviceName = 'Dịch vụ lưu trú';
//         placeName = roomType?.hotelId?.name || null;
//       } else if (bookingDetail?.serviceId) {
//         const service = await ServiceModel.findById(bookingDetail.serviceId);
//         serviceName = service?.name || null;
//         if (service?.placeId) {
//           const checkPlaceId = await ServiceModel.findById(
//             bookingDetail.serviceId
//           ).populate('placeId', 'name');
//           placeName = checkPlaceId?.placeId?.name || null;
//         } else if (service?.hotelId) {
//           const checkHotelId = await ServiceModel.findById(
//             bookingDetail.serviceId
//           ).populate('hotelId', 'name');
//           placeName = checkHotelId?.hotelId?.name || null;
//         }
//       }
//       return {
//         ...b.toObject(),
//         placeName,
//         serviceName
//       };
//     })
//   );

//   return result;
// };

// module.exports = { createBooking, getBookings };
