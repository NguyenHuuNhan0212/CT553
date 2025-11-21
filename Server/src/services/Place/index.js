const PlaceModel = require('../../models/Place');
const OwnerInfo = require('../../models/Supplier');
const MessageModel = require('../../models/Message');
const ItineraryDetailModel = require('../../models/ItineraryDetail');
const { sendMail } = require('../../utils/nodemailer');
const addPlaceService = async (userId, data) => {
  const { type, name, address, images, description, services, hotelDetail } =
    data;

  const checkPlace = await PlaceModel.findOne({
    userId,
    type,
    name,
    address,
    deleted: false
  });
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
  }).populate('userId', '_id fullName phone');
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
  if (!place.isApprove) {
    await PlaceModel.findByIdAndDelete(place._id);
    return;
  }
  await PlaceModel.findByIdAndUpdate(place._id, { deleted: true });
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

// Kiểm tra lại nên hiển thị danh sách các địa điểm có nhiều trong lịch trình
const getPlacesPopularByType = async (type) => {
  const places = await PlaceModel.find({
    type,
    isActive: true,
    deleted: false,
    isApprove: true
  }).lean();
  if (!places.length) return [];
  const placeIds = places.map((p) => p._id);

  const popularStats = await ItineraryDetailModel.aggregate([
    {
      $match: { placeId: { $in: placeIds } }
    },
    {
      $group: {
        _id: '$placeId',
        total: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);

  const popularPlaces = popularStats.map((stat) => {
    const place = places.find((p) => p._id.toString() === stat._id.toString());
    return {
      ...place,
      total: stat.total
    };
  });

  return popularPlaces;
};

const getPlacesPopular = async () => {
  const places = await PlaceModel.find({
    isActive: true,
    deleted: false,
    isApprove: true
  }).lean();
  const placeIds = places.map((p) => p._id);
  const popularStats = await ItineraryDetailModel.aggregate([
    {
      $match: { placeId: { $in: placeIds } }
    },
    {
      $group: {
        _id: '$placeId',
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 8 }
  ]);
  const placePopularIds = popularStats.map((p) => p._id.toString());
  const popularPlaces = places.filter((p) => {
    return placePopularIds.includes(p._id.toString());
  });
  return popularPlaces;
};

const handleGetStatsPlace = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền.');
  }
  const places = await PlaceModel.find({ deleted: false });
  const placesGroupType = await PlaceModel.aggregate([
    {
      $match: {
        deleted: false
      }
    },
    {
      $group: {
        _id: '$type',
        totalPlace: { $sum: 1 }
      }
    }
  ]);
  return {
    totalPlace: places.length || 0,
    placesGroupType
  };
};
const handleGetPlacesAwaitConfirm = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền');
  }
  const places = await PlaceModel.find({
    isApprove: false,
    deleted: false,
    $expr: { $eq: ['$createdAt', '$updatedAt'] }
  })
    .lean()
    .populate('userId', 'email fullName');
  return {
    total: places.length || 0,
    places
  };
};

const handleApprovePlace = async (role, placeId) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền phê duyệt địa điểm.');
  }

  const place = await PlaceModel.findOne({
    _id: placeId,
    isApprove: false
  }).populate('userId', 'email fullName');
  if (!place) {
    throw new Error('Địa điểm không tồn tại hoặc đã được phê duyệt.');
  }

  if (place.createdAt.getTime() !== place.updatedAt.getTime()) {
    throw new Error('Địa điểm này đã được xử lý trước đó.');
  }

  await PlaceModel.findByIdAndUpdate(place._id, {
    isApprove: true,
    updatedAt: new Date()
  });
  sendMail({
    to: place.userId?.email,
    subject: 'Địa điểm của bạn đã được phê duyệt!',
    text: `Xin chào ${place.userId?.fullName}, địa điểm "${place.name}" của bạn đã được admin phê duyệt thành công.`,
    html: `
    <div style="font-family: Arial; padding: 10px;">
      <h2> Xin chào ${place.userId?.fullName},</h2>
      <p>Địa điểm <b>${place.name}</b> của bạn đã được <span style="color:green;">phê duyệt thành công</span>!</p>
      <p>Bạn có thể đăng nhập để truy cập trang quản lý để cập nhật thêm thông tin.</p>
      <a href="http://localhost:5173/login" 
         style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Đi đến trang đăng nhập
      </a>
      <br><br>
      <p>Trân trọng,<br>Đội ngũ Vigo Travel</p>
    </div>
  `
  });
  return { message: 'Phê duyệt địa điểm thành công.' };
};

const handleGetAllAdmin = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền');
  }
  const places = await PlaceModel.find({ deleted: false })
    .sort({ createdAt: -1 })
    .populate('userId', 'email fullName');
  return places;
};

const handleRejectPlace = async (role, placeId) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền phê duyệt địa điểm.');
  }

  const place = await PlaceModel.findOne({
    _id: placeId,
    isApprove: false
  }).populate('userId', 'email fullName');
  if (!place) {
    throw new Error('Địa điểm không tồn tại hoặc đã được phê duyệt.');
  }

  if (place.createdAt.getTime() !== place.updatedAt.getTime()) {
    throw new Error('Địa điểm này đã được xử lý trước đó.');
  }

  await PlaceModel.findByIdAndUpdate(place._id, {
    isApprove: false,
    updatedAt: new Date()
  });
  sendMail({
    to: place.userId?.email,
    subject: 'Địa điểm của bạn đã bị từ chối phê duyệt!',
    text: `Xin chào ${place.userId?.fullName}, địa điểm "${place.name}" của bạn đã  bị admin từ chối phê duyệt vì lý do nào đó.`,
    html: `
    <div style="font-family: Arial; padding: 10px;">
      <h2> Xin chào ${place.userId?.fullName},</h2>
      <p>Địa điểm <b>${place.name}</b> của bạn đã bị <span style="color:red;">từ chối phê duyệt.</span>!</p>
      <p>Bạn có thể đăng nhập để truy cập trang quản lý để cập nhật thêm thông tin.</p>
      <a href="http://localhost:5173/login" 
         style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Đi đến trang đăng nhập
      </a>
      <br><br>
      <p>Trân trọng,<br>Đội ngũ Vigo Travel</p>
    </div>
  `
  });
  return { message: 'Từ chối địa điểm thành công.' };
};

const handleGetAllPlaceRejected = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền thực hiện.');
  }

  const places = await PlaceModel.find({
    isApprove: false,
    $expr: { $ne: ['$createdAt', '$updatedAt'] }
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'email fullName');
  return places;
};

const handleGetAllPlaceHaveMessage = async (userId) => {
  let placeIds = await MessageModel.distinct('placeId', { receiver: userId });
  placeIds = await PlaceModel.find({
    _id: { $in: placeIds },
    userId: { $eq: userId }
  }).distinct('_id');
  const places = await PlaceModel.find({ _id: { $in: placeIds } }).lean();

  const result = await Promise.all(
    places.map(async (place) => {
      const unread = await MessageModel.countDocuments({
        receiver: userId,
        placeId: place._id,
        isRead: false
      });

      return {
        ...place,
        unread
      };
    })
  );

  return result;
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
  getPlacesPopular,
  handleGetStatsPlace,
  handleGetPlacesAwaitConfirm,
  handleApprovePlace,
  handleGetAllAdmin,
  handleRejectPlace,
  handleGetAllPlaceRejected,
  handleGetAllPlaceHaveMessage
};
