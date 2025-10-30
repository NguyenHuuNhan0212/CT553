const PlaceModel = require('../../models/Place');
const UserModel = require('../../models/User');
const ItineraryDetailModel = require('../../models/ItineraryDetail');
const handleGetStatsPlaceByType = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền truy cập.');
  }
  const data = await PlaceModel.aggregate([
    {
      $match: {
        isActive: true,
        isApprove: true,
        deleted: false
      }
    },
    {
      $group: {
        _id: '$type',
        totalPlaces: { $sum: 1 }
      }
    }
  ]);
  return data;
};

const handleGetUsersSevenDaysNewest = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền truy cập.');
  }
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const users = await UserModel.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
        role: { $ne: 'admin' }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalUsers: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  return users;
};
const handleGetFivePlacesPopular = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền truy cập.');
  }
  const places = await PlaceModel.find({
    isActive: true,
    isApprove: true,
    deleted: false
  })
    .lean()
    .sort({ bookingCount: -1 })
    .limit(5);
  return places;
};

const handleGetFivePlacesHaveInItinerary = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền truy cập.');
  }
  const itineraryStats = await ItineraryDetailModel.aggregate([
    {
      $group: {
        _id: '$placeId',
        total: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    },
    { $limit: 5 }
  ]);
  const popularPlaces = itineraryStats.map((stat) => stat._id);
  const places = await PlaceModel.find({
    _id: { $in: popularPlaces },
    isActive: true,
    isApprove: true,
    deleted: false
  }).lean();

  const placesMap = places.map((place) => {
    return {
      ...place,
      total:
        itineraryStats.find(
          (stat) => stat._id.toString() === place._id.toString()
        )?.total || 0
    };
  });
  return placesMap;
};
module.exports = {
  handleGetStatsPlaceByType,
  handleGetUsersSevenDaysNewest,
  handleGetFivePlacesPopular,
  handleGetFivePlacesHaveInItinerary
};
