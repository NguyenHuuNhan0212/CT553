const PlaceModel = require('../../models/Place');
const HotelModel = require('../../models/Hotel');
const ServiceModel = require('../../models/ServiceOther');
const RoomTypeModel = require('../../models/RoomType');
const OwnerInfo = require('../../models/OwnerInfo');
const addPlaceService = async (userId, data) => {
  const {
    type,
    name,
    address,
    images,
    description,
    avgPrice,
    commissionPerCentage,
    roomTypes,
    services
  } = data;
  let totalServices = 0;
  const checkPlace = await PlaceModel.findOne({ userId, type, name, address });
  if (checkPlace) {
    throw new Error('Địa điểm đã tồn tại. Bạn không thể thêm nữa.');
  } else {
    const place = new PlaceModel({
      userId,
      type,
      name,
      address,
      images: images || [],
      description,
      avgPrice
    });
    await place.save();
    let hotel = null;

    if (type === 'hotel') {
      totalServices += 1;
      hotel = new HotelModel({
        placeId: place._id,
        commissionPerCentage
      });
      await hotel.save();
      let parsedRoomTypes = [];

      if (typeof roomTypes === 'string') {
        try {
          parsedRoomTypes = JSON.parse(roomTypes);
        } catch (err) {
          console.error('Parse roomTypes error:', err);
        }
      } else if (Array.isArray(roomTypes)) {
        parsedRoomTypes = roomTypes;
      }
      if (Array.isArray(parsedRoomTypes)) {
        for (let rt of parsedRoomTypes) {
          const roomType = new RoomTypeModel({
            hotelId: hotel._id,
            name: rt.name,
            capacity: rt.capacity,
            totalRooms: rt.totalRooms,
            pricePerNight: rt.pricePerNight
          });
          await roomType.save();
        }
      }
    }
    let parsedServices = [];
    if (typeof services === 'string') {
      try {
        parsedServices = JSON.parse(services);
      } catch (err) {
        console.error('Parse services error:', err);
      }
    } else if (Array.isArray(services)) {
      parsedServices = services;
    }
    if (Array.isArray(parsedServices)) {
      for (let s of parsedServices) {
        totalServices += 1;
        const service = new ServiceModel({
          name: s.name,
          description: s.description,
          price: s.price,
          type: s.type,
          placeId: place._id
        });
        await service.save();
      }
    }
    const updatePlace = await PlaceModel.findByIdAndUpdate(
      place._id,
      {
        totalServices
      },
      { new: true }
    );
    return {
      message: 'Thêm địa điểm mới thành công.'
    };
  }
};

const getAllPlaceOffUser = async (userId) => {
  const places = await PlaceModel.find({ userId });
  if (!places.length) {
    throw new Error('Bạn chưa đăng địa điểm du lịch nào.');
  } else {
    const placesId = places.map((place) => place._id);
    return {
      places,
      message: 'Lấy danh sách địa điểm du lịch của người dùng thành công.'
    };
  }
};

const getOnePlace = async (placeId) => {
  const place = await PlaceModel.findById(placeId);
  if (!place) {
    throw new Error('Không tìm thấy địa điểm bạn chọn.');
  } else {
    const services = await ServiceModel.find({ placeId });
    const ownerInfo = await OwnerInfo.findOne({
      userId: place.userId
    }).populate('userId', 'fullName');
    if (place.type === 'hotel') {
      const hotel = await HotelModel.findOne({ placeId });
      if (!hotel) {
        throw new Error('Không tìm thấy khách sạn/nhà nghĩ này.');
      } else {
        const roomTypes = await RoomTypeModel.find({ hotelId: hotel._id });
        return {
          place,
          services,
          roomTypes,
          ownerInfo,
          message: 'Lấy thông tin địa điểm thành công'
        };
      }
    } else {
      return {
        place,
        ownerInfo,
        services,
        message: 'Lấy thông tin địa điểm thành công'
      };
    }
  }
};
module.exports = { addPlaceService, getAllPlaceOffUser, getOnePlace };
