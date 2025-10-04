const PlaceModel = require('../../models/Place');
const OwnerInfo = require('../../models/Supplier');

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

  const ownerInfo = await OwnerInfo.findOne({
    userId: place.userId
  }).populate('userId', 'fullName');
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
    minPricePerNight,
    message: 'Lấy thông tin địa điểm thành công'
  };
};

const getAllPlace = async () => {
  return await PlaceModel.find({ deleted: false, isApprove: true }).sort({
    createdAt: -1
  });
};

const getPlaceRelative = async (id, type, address) => {
  const places = await PlaceModel.find({
    type,
    address: { $regex: address, $options: 'i' },
    _id: { $ne: id },
    deleted: false,
    isApprove: true
  });
  return { places };
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

// ✅ Toggle active
const updateActivePlace = async (userId, placeId) => {
  const place = await PlaceModel.findById(placeId);
  if (!place) throw new Error('Địa điểm không tồn tại');

  place.isActive = !place.isActive;
  await place.save();

  return {
    place,
    message: 'Cập nhật trạng thái hoạt động thành công.'
  };
};
// ✅ Cập nhật Place + dịch vụ
const updatePlaceService = async (placeId, userId, data) => {
  const { type, name, address, images, description, services, hotelDetail } =
    data;

  const place = await PlaceModel.findOne({ _id: placeId, userId });
  if (!place)
    throw new Error('Địa điểm không tồn tại hoặc bạn không có quyền sửa.');

  // Update fields
  place.type = type || place.type;
  place.name = name || place.name;
  place.address = address || place.address;
  place.description = description || place.description;
  if (images && images.length > 0) place.images = images;

  let placeHotelDetailParsed = null;
  if (type === 'hotel') {
    if (hotelDetail) {
      try {
        placeHotelDetailParsed = JSON.parse(hotelDetail); // parse lại JSON từ string
      } catch (err) {
        console.error('Parse hotelDetail error:', err);
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
      console.error('Parse services error:', err);
    }
  } else if (Array.isArray(services)) {
    parsedServices = services;
  }
  place.services = parsedServices;

  await place.save();

  return { message: 'Cập nhật địa điểm thành công.', place };
};
module.exports = {
  addPlaceService,
  getOnePlace,
  getAllPlace,
  getPlaceRelative,
  getAllPlaceOfUser,
  removePlace,
  updateActivePlace,
  updatePlaceService
};
