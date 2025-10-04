const PlaceModel = require('../../models/Place');

const addRoomType = async (placeId, roomTypeData) => {
  const place = await PlaceModel.findById(placeId);
  if (!place || place.type !== 'hotel') {
    throw new Error('Không tìm thấy khách sạn hợp lệ.');
  }

  place.hotelDetail.roomTypes.push(roomTypeData);
  await place.save();

  return {
    message: 'Thêm loại phòng thành công',
    roomTypes: place.hotelDetail.roomTypes
  };
};
