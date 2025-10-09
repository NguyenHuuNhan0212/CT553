const { default: mongoose } = require('mongoose');
const PlaceModel = require('../../models/Place');
const OwnerInfo = require('../../models/Supplier');
const { nightsBetween, countBookedRooms } = require('../../utils/hotel');

const searchHotels = async (location, checkIn, checkOut, guests) => {
  if (!location || !checkIn || !checkOut || !guests) {
    throw new Error('Thiếu tham số location / checkIn / checkOut / guests');
  }
  const nights = nightsBetween(checkIn, checkOut);
  const hotels = await PlaceModel.find({
    isActive: true,
    deleted: false,
    isApprove: true,
    address: new RegExp(location, 'i')
  }).lean();

  const results = await Promise.all(
    hotels.map(async (hotel) => {
      const roomTypes = hotel?.hotelDetail?.roomTypes || [];

      const filteredRoomTypes = roomTypes.filter(
        (r) => r.capacity >= Number(guests)
      );
      if (!filteredRoomTypes.length) {
        return null;
      }
      const availables = await Promise.all(
        filteredRoomTypes.map(async (rt) => {
          const booked = await countBookedRooms(
            hotel._id,
            rt._id,
            checkIn,
            checkOut
          );
          const available = (rt.totalRooms || 0) - booked;
          return { ...rt, available };
        })
      );
      const usable = availables.filter((a) => a.available > 0);
      if (!usable.length) return null;
      const minPricePerNight = Math.min(...usable.map((r) => r.pricePerNight));
      const minTotal = minPricePerNight * nights;

      return {
        hotelId: hotel._id,
        name: hotel.name,
        address: hotel.address,
        images: hotel.images || [],
        minPricePerNight,
        minTotal,
        nights,
        availableRoomTypesCount: usable.length
      };
    })
  );

  const filtered = results.filter((r) => r !== null);
  return filtered;
};
const searchHotelByAddress = async (address) => {
  const hotels = await PlaceModel.find({ address });
  return {
    hotels
  };
};
const getHotelDetail = async (id, checkIn, checkOut, guests) => {
  const hotel = await PlaceModel.findById(id).lean();
  if (!hotel) {
    throw new Error('Không tìm thấy địa điểm bạn chọn.');
  }

  if (!checkIn || !checkOut || !guests) {
    return { hotel };
  }
  const ownerInfo = await OwnerInfo.findOne({
    userId: hotel.userId
  }).populate('userId', 'fullName');
  const nights = nightsBetween(checkIn, checkOut);
  const services = hotel?.services || [];
  const roomTypes = hotel?.hotelDetail?.roomTypes || [];
  const filteredRoomTypes = roomTypes.filter(
    (rt) => rt.capacity >= Number(guests)
  );
  const roomStatuses = await Promise.all(
    filteredRoomTypes.map(async (rt) => {
      const booked = await countBookedRooms(
        hotel._id,
        rt._id,
        checkIn,
        checkOut
      );
      const available = (rt.totalRooms || 0) - booked;
      return {
        roomTypeId: rt._id,
        name: rt.name,
        capacity: rt.capacity,
        pricePerNight: rt.pricePerNight,
        totalRooms: rt.totalRooms,
        availableRooms: Math.max(0, available),
        totalPriceForNights: rt.pricePerNight * nights
      };
    })
  );
  const minPricePerNight = roomStatuses.reduce((min, rt) => {
    return rt.pricePerNight < min ? rt.pricePerNight : min;
  }, Infinity);
  return {
    info: hotel,
    hotelDetail: hotel?.hotelDetail,
    ownerInfo,
    services,
    nights,
    minPricePerNight,
    roomTypes: roomStatuses
  };
};

module.exports = {
  searchHotels,
  searchHotelByAddress,
  getHotelDetail
};
