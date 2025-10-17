const ItineraryModel = require('../../models/Itinerary');
const UserModel = require('../../models/User');
const ItineraryDetailModel = require('../../models/ItineraryDetail');

const handleCreate = async (userId, data) => {
  const { title, destination, startDate, creatorName, endDate, details } = data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const numDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const itinerary = await ItineraryModel.create({
    userId,
    title,
    destination,
    numDays,
    creatorName,
    startDate,
    endDate
  });

  if (details && details.length > 0) {
    const detailDocs = details.map((d) => ({
      itineraryId: itinerary._id,
      placeId: d.placeId,
      visitDay: d.visitDay,
      note: d.note,
      startTime: d.startTime,
      endTime: d.endTime,
      order: d.order
    }));
    await ItineraryDetailModel.insertMany(detailDocs);
  }
  return {
    message: 'Tạo lịch trình thành công.'
  };
};

const handleGetAllByUserId = async (userId) => {
  const itineraries = await ItineraryModel.find({ userId })
    .lean()
    .sort({ createdAt: -1 });
  return {
    itineraries
  };
};

const handleGetItineraryDetail = async (itineraryId) => {
  const itinerary = await ItineraryModel.findById(itineraryId);
  if (!itinerary) {
    throw new Error('Lịch trình không tồn tại.');
  } else {
    const itineraryDetails = await ItineraryDetailModel.find({ itineraryId })
      .sort({ visitDay: 1, order: 1 })
      .populate('placeId');

    const grouped = {};

    for (const detail of itineraryDetails) {
      const day = detail.visitDay;

      if (!grouped[day]) {
        grouped[day] = [];
      }

      grouped[day].push(detail);
    }

    // Bước 3: Chuyển về dạng mảng dễ dùng ở frontend
    const result = Object.entries(grouped).map(([day, items]) => ({
      day: `Ngày ${day}`,
      places: items.map((d) => ({
        placeId: d.placeId,
        images: d.placeId?.images,
        name: d.placeId?.name,
        address: d.placeId?.address,
        duration: `${d.startTime || 'Thời gian bắt đầu'} - ${
          d.endTime || 'Thời gian kết thúc'
        }`,
        note: d.note
      }))
    }));
    return {
      itinerary,
      itineraryDetail: result
    };
  }
};
const handleUpdateStatus = async (userId, itineraryId) => {
  const itinerary = await ItineraryModel.findOneAndUpdate(
    { userId, _id: itineraryId },
    { status: 'completed' }
  );
  if (!itinerary) {
    throw new Error('Lịch trình không tồn tại.');
  } else {
    return {
      message: 'Cập nhật trạng thái thành công.'
    };
  }
};
const handleAddPriceAndGuest = async (userId, itineraryId, data) => {
  const { people, priceForItinerary } = data;
  const itinerary = await ItineraryModel.findOne({
    userId,
    _id: itineraryId
  }).lean();
  if (!itinerary) {
    throw new Error('Không tìm thấy lịch trình.');
  } else {
    const itineraryNew = await ItineraryModel.findByIdAndUpdate(itinerary._id, {
      people,
      priceForItinerary
    });
    return {
      itineraryNew,
      message: 'Thêm chi phí và số lượng người thành công.'
    };
  }
};
module.exports = {
  handleCreate,
  handleGetAllByUserId,
  handleGetItineraryDetail,
  handleUpdateStatus,
  handleAddPriceAndGuest
};
