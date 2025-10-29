const PlaceModel = require('../../models/Place');
const UserModel = require('../../models/User');

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
module.exports = {
  handleGetStatsPlaceByType,
  handleGetUsersSevenDaysNewest,
  handleGetFivePlacesPopular
};
