const HotelModel = require('../../models/Hotel');
const ServiceModel = require('../../models/Service');
const RoomTypeModel = require('../../models/RoomType');
const OwnerInfo = require('../../models/Supplier');
const addHotel = async (userId, data) => {
  const { name, address, images, description, roomTypes, services } = data;
  let totalServices = 1;
  const checkHotel = await HotelModel.findOne({ userId, name, address });
  if (checkHotel) {
    throw new Error('Địa điểm đã tồn tại. Bạn không thể thêm nữa.');
  } else {
    const hotel = new HotelModel({
      userId,
      name,
      address,
      images: images || [],
      description
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
          hotelId: hotel._id
        });
        await service.save();
      }
    }
    const updateHotel = await HotelModel.findByIdAndUpdate(
      hotel._id,
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

const getOneHotel = async (hotelId) => {
  const hotel = await HotelModel.findById(hotelId);
  if (!hotel) {
    throw new Error('Không tìm thấy địa điểm bạn chọn.');
  } else {
    const services = await ServiceModel.find({ hotelId });
    const ownerInfo = await OwnerInfo.findOne({
      userId: hotel.userId
    }).populate('userId', 'fullName');

    const roomTypes = await RoomTypeModel.find({ hotelId: hotel._id });
    return {
      info: hotel,
      services,
      roomTypes,
      ownerInfo,
      message: 'Lấy thông tin địa điểm thành công'
    };
  }
};
const getAllHotel = async () => {
  return await HotelModel.find({ deleted: false, isApprove: true });
};
const getHotelsNearPlace = async (address) => {
  const hotels = await HotelModel.find({
    address: address,
    deleted: false,
    isApprove: true
  });
  return {
    hotels
  };
};
const getHotelRelative = async (id, address) => {
  const hotels = await HotelModel.find({
    _id: { $ne: id },
    address: { $regex: address, $options: 'i' },
    deleted: false,
    isApprove: true
  });
  return {
    hotels
  };
};

const removeHotel = async (userId, hotelId) => {
  const hotel = await HotelModel.findOne({ userId, _id: hotelId });
  if (!hotel) {
    throw new Error('Địa điểm không tồn tại');
  } else {
    const deletedHotel = await HotelModel.findByIdAndUpdate(
      hotelId,
      { deleted: true },
      { new: true }
    );
    return {
      message: 'Xóa địa điểm thành công'
    };
  }
};
const updateActiveHotel = async (userId, hotelId) => {
  const hotel = await HotelModel.findById(hotelId);
  if (!hotel) {
    throw new Error('Địa điểm không tồn tại');
  } else {
    const updateStatusActive = await HotelModel.findOneAndUpdate(
      { userId, _id: hotelId },
      { isActive: !hotel.isActive },
      { new: true }
    );
    return {
      updateStatusActive,
      message: 'Cập nhật trạng thái hoạt động thành công.'
    };
  }
};
const updateHotel = async (hotelId, userId, data) => {
  const { name, address, images, description, roomTypes, services } = data;

  const hotel = await HotelModel.findOne({ _id: hotelId, userId });
  if (!hotel) {
    throw new Error('Địa điểm không tồn tại hoặc bạn không có quyền sửa.');
  }

  let totalServices = 0;

  hotel.name = name;
  hotel.address = address;
  hotel.description = description;
  if (images && images.length > 0) {
    hotel.images = images;
  }
  await hotel.save();

  await RoomTypeModel.deleteMany({ hotelId: hotel._id });
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
  totalServices += 1;
  await ServiceModel.deleteMany({ hotelId: hotel._id });
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
        hotelId: hotel._id
      });
      await service.save();
    }
  }

  await HotelModel.findByIdAndUpdate(hotel._id, { totalServices });

  return { message: 'Cập nhật địa điểm thành công.' };
};

module.exports = {
  addHotel,
  getOneHotel,
  getAllHotel,
  getHotelsNearPlace,
  removeHotel,
  getHotelRelative,
  updateActiveHotel,
  updateHotel
};
