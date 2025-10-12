const PlaceModel = require('../../models/Place');
const OwnerInfo = require('../../models/Supplier');
const BookingModel = require('../../models/Booking');
const addPlaceService = async (userId, data) => {
  const { type, name, address, images, description, services, hotelDetail } =
    data;

  const checkPlace = await PlaceModel.findOne({ userId, type, name, address });
  if (checkPlace) {
    throw new Error('Địa điểm đã tồn tại. Bạn không thể thêm nữa.');
  }
  let parsedHotelDetail = null;
  if (type === 'hotel') {
    if (hotelDetail) {
      try {
        parsedHotelDetail = JSON.parse(hotelDetail); // parse lại JSON từ string
      } catch (err) {
        console.error('Parse hotelDetail error:', err);
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
  const place = new PlaceModel({
    userId,
    type,
    name,
    address,
    images: images || [],
    description,
    hotelDetail: parsedHotelDetail,
    services: parsedServices
  });

  await place.save();

  return {
    message: 'Thêm địa điểm mới thành công.',
    place
  };
};

const getOnePlace = async (placeId) => {
  const place = await PlaceModel.findById(placeId);
  if (!place) throw new Error('Không tìm thấy địa điểm bạn chọn.');
  if (place.deleted) {
    throw new Error('Địa điểm hiện không còn.');
  }
  const ownerInfo = await OwnerInfo.findOne({
    userId: place.userId
  }).populate('userId', 'fullName phone');
  let minPricePerNight = null;
  if (place.type === 'hotel') {
    minPricePerNight = place.hotelDetail?.roomTypes.reduce((min, rt) => {
      return rt.pricePerNight < min ? rt.pricePerNight : min;
    }, Infinity);
  }
  return {
    info: place,
    ownerInfo,
    services: place.services,
    hotelDetail: place.hotelDetail,
    roomTypes: place.hotelDetail?.roomTypes || [],
    minPricePerNight,
    message: 'Lấy thông tin địa điểm thành công'
  };
};

const getAllPlace = async () => {
  return await PlaceModel.find({
    isActive: true,
    deleted: false,
    isApprove: true
  }).sort({
    createdAt: -1
  });
};

const getPlaceRelative = async (id, type, address) => {
  const places = await PlaceModel.find({
    type,
    address: { $regex: address, $options: 'i' },
    _id: { $ne: id },
    deleted: false,
    isActive: true,
    isApprove: true
  });
  return { places };
};
const getPlacesByAddressAndType = async (type, address) => {
  if (type === 'all') {
    const places = await PlaceModel.find({
      address: { $regex: address, $options: 'i' },
      deleted: false,
      isActive: true,
      isApprove: true
    });
    return { places };
  } else {
    const places = await PlaceModel.find({
      address: { $regex: address, $options: 'i' },
      type: type,
      deleted: false,
      isActive: true,
      isApprove: true
    });
    return { places };
  }
};
const getHotelsNearPlace = async (address) => {
  const hotels = await PlaceModel.find({
    type: 'hotel',
    address: address,
    deleted: false,
    isActive: true,
    isApprove: true
  });
  return { hotels };
};

const getAllPlaceOfUser = async (userId) => {
  return await PlaceModel.find({ userId: userId, deleted: false }).sort({
    createdAt: -1
  });
};
const removePlace = async (userId, placeId) => {
  const place = await PlaceModel.findOne({ userId, _id: placeId });
  if (!place) throw new Error('Địa điểm không tồn tại');

  await PlaceModel.findByIdAndUpdate(placeId, { deleted: true });
  return { message: 'Xóa địa điểm thành công' };
};

const updateActivePlace = async (userId, placeId) => {
  const place = await PlaceModel.findOne({ _id: placeId, userId });
  if (!place) throw new Error('Địa điểm không tồn tại');

  place.isActive = !place.isActive;
  await place.save();

  return {
    place,
    message: 'Cập nhật trạng thái hoạt động thành công.'
  };
};

const updatePlaceService = async (placeId, userId, data) => {
  const { type, name, address, images, description, services, hotelDetail } =
    data;

  const place = await PlaceModel.findOne({ _id: placeId, userId });
  if (!place)
    throw new Error('Địa điểm không tồn tại hoặc bạn không có quyền sửa.');

  place.type = type || place.type;
  place.name = name || place.name;
  place.address = address || place.address;
  place.description = description || place.description;
  if (images && images.length > 0) place.images = images;
  if (type !== 'hotel') {
    place.hotelDetail = null;
  }
  let placeHotelDetailParsed = null;
  if (type === 'hotel') {
    if (hotelDetail) {
      try {
        placeHotelDetailParsed = JSON.parse(hotelDetail);
      } catch (err) {
        console.error('Parse hotelDetail lỗi:', err);
      }
    }
    place.hotelDetail = placeHotelDetailParsed;
  }
  let parsedServices = [];
  place.services = [];
  if (typeof services === 'string') {
    try {
      parsedServices = JSON.parse(services);
    } catch (err) {
      console.error('Parse services lỗi:', err);
    }
  } else if (Array.isArray(services)) {
    parsedServices = services;
  }
  place.services = parsedServices;

  await place.save();

  return { message: 'Cập nhật địa điểm thành công.', place };
};

const getPlacesPopularByType = async (type) => {
  const places = await PlaceModel.find({
    type,
    isActive: true,
    deleted: false,
    isApprove: true
  }).lean();

  if (!places.length) return [];
  const placeIds = places.map((p) => p._id);

  const popularStats = await BookingModel.aggregate([
    { $match: { placeId: { $in: placeIds } } },
    { $group: { _id: '$placeId', totalBookings: { $sum: 1 } } },
    { $sort: { totalBookings: -1 } },
    { $limit: 8 }
  ]);
  const popularPlaces = await Promise.all(
    popularStats.map(async (stat) => {
      const place = places.find(
        (p) => p._id.toString() === stat._id.toString()
      );
      return {
        ...place,
        totalBookings: stat.totalBookings
      };
    })
  );

  return popularPlaces;
};

const getPlacesPopular = async () => {
  const places = await PlaceModel.find({
    isActive: true,
    isApprove: true,
    deleted: false
  }).lean();

  const popularStats = await BookingModel.aggregate([
    { $group: { _id: '$placeId', totalBookings: { $sum: 1 } } },
    { $sort: { totalBookings: -1 } },
    { $limit: 8 }
  ]);

  const popularPlaces = popularStats
    .map((stat) => {
      const place = places.find(
        (p) => p._id.toString() === stat._id.toString()
      );
      if (!place) return null;
      return {
        ...place,
        totalBookings: stat.totalBookings
      };
    })
    .filter((p) => p !== null);

  return popularPlaces;
};

module.exports = {
  addPlaceService,
  getOnePlace,
  getAllPlace,
  getPlaceRelative,
  getAllPlaceOfUser,
  removePlace,
  updateActivePlace,
  updatePlaceService,
  getHotelsNearPlace,
  getPlacesByAddressAndType,
  getPlacesPopularByType,
  getPlacesPopular
};
