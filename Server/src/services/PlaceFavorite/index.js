const UserFavoriteModel = require('../../models/UserFavorite');
const PlaceModel = require('../../models/Place');
const handleAddPlaceFavorite = async (userId, placeId) => {
  const placeFavorite = await UserFavoriteModel.findOne({ userId, placeId });
  if (placeFavorite) {
    throw new Error('Địa điểm đã tồn tại trong danh sách yêu thích.');
  } else {
    await UserFavoriteModel.create({ userId, placeId });
    return {
      message: 'Thêm địa điểm vào danh sách yêu thích thành công.'
    };
  }
};

const handleRemovePlaceFavorite = async (userId, placeId) => {
  const placeFavorite = await UserFavoriteModel.findOne({ userId, placeId });
  if (!placeFavorite) {
    throw new Error(
      'Địa điểm không tồn tại trong danh sách yêu thích của bạn.'
    );
  } else {
    await UserFavoriteModel.findOneAndDelete({ userId, placeId });
    return {
      message: 'Xóa địa điểm khỏi danh sách yêu thích thành công.'
    };
  }
};

const handleGetPlacesFavorite = async (userId) => {
  const placesFavorite = await UserFavoriteModel.find({ userId })
    .sort({ addDate: -1 })
    .populate('placeId');
  if (!placesFavorite.length) {
    return [];
  } else {
    // const placeIds = placesFavorite.map((pf) => pf.placeId);
    // const places = await PlaceModel.find({ _id: { $in: placeIds } });
    return placesFavorite;
  }
};
module.exports = {
  handleAddPlaceFavorite,
  handleRemovePlaceFavorite,
  handleGetPlacesFavorite
};
