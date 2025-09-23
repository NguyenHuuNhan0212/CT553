const PlaceModel = require('../../models/Place');
const HotelModel = require('../../models/Hotel');
const ServiceModel = require('../../models/ServiceOther');
const RoomTypeModel = require('../../models/RoomType');
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
    return {
      message: 'Thêm địa điểm mới thành công.'
    };
  }
};

module.exports = { addPlaceService };
