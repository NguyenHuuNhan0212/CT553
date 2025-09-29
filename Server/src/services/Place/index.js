const PlaceModel = require('../../models/Place');
const ServiceModel = require('../../models/Service');
const OwnerInfo = require('../../models/Supplier');
const addPlaceService = async (userId, data) => {
  const {
    type,
    name,
    address,
    images,
    description,
    commissionPerCentage,
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
      description
    });
    await place.save();
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

const getOnePlace = async (placeId) => {
  const place = await PlaceModel.findById(placeId);
  if (!place) {
    throw new Error('Không tìm thấy địa điểm bạn chọn.');
  } else {
    const services = await ServiceModel.find({ placeId });
    const ownerInfo = await OwnerInfo.findOne({
      userId: place.userId
    }).populate('userId', 'fullName');

    return {
      info: place,
      ownerInfo,
      services,
      message: 'Lấy thông tin địa điểm thành công'
    };
  }
};
const getAllPlace = async () => {
  return await PlaceModel.find({ deleted: false, isApprove: true });
};
const getPlaceRelative = async (id, type, address) => {
  const places = await PlaceModel.find({
    type: type,
    address: { $regex: address, $options: 'i' },
    _id: { $ne: id },
    deleted: false,
    isApprove: true
  });
  return {
    places
  };
};

const removePlace = async (userId, placeId) => {
  const place = await PlaceModel.findOne({ userId, _id: placeId });
  if (!place) {
    throw new Error('Địa điểm không tồn tại');
  } else {
    const deletedPlace = await PlaceModel.findByIdAndUpdate(
      placeId,
      { deleted: true },
      { new: true }
    );
    return {
      message: 'Xóa địa điểm thành công'
    };
  }
};
const updateActivePlace = async (userId, placeId) => {
  const place = await PlaceModel.findById(placeId);
  if (!place) {
    throw new Error('Địa điểm không tồn tại');
  } else {
    const updateStatusActive = await PlaceModel.findOneAndUpdate(
      { userId, _id: placeId },
      { isActive: !place.isActive },
      { new: true }
    );
    return {
      place,
      message: 'Cập nhật trạng thái hoạt động thành công.'
    };
  }
};
const updatePlaceService = async (placeId, userId, data) => {
  const {
    type,
    name,
    address,
    images,
    description,
    commissionPerCentage,
    services
  } = data;

  const place = await PlaceModel.findOne({ _id: placeId, userId });
  if (!place) {
    throw new Error('Địa điểm không tồn tại hoặc bạn không có quyền sửa.');
  }

  let totalServices = 0;

  place.type = type;
  place.name = name;
  place.address = address;
  place.description = description;
  if (images && images.length > 0) {
    place.images = images;
  }
  await place.save();

  await ServiceModel.deleteMany({ placeId: place._id });
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

  await PlaceModel.findByIdAndUpdate(place._id, { totalServices });

  return { message: 'Cập nhật địa điểm thành công.' };
};

module.exports = {
  addPlaceService,
  getOnePlace,
  getAllPlace,
  getPlaceRelative,
  removePlace,
  updateActivePlace,
  updatePlaceService
};
