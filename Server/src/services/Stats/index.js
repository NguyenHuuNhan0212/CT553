const BookingModel = require('../../models/Booking');
const PlaceModel = require('../../models/Place');

const handleGetStats = async (userId) => {
  const places = await PlaceModel.find({
    userId,
    deleted: false,
    isActive: true,
    isApprove: true
  }).lean();
  if (!places.length) {
    return {
      totalRevenue: 0,
      totalBookings: 0,
      totalPlaces: 0,
      revenueByPlace: []
    };
  }
  const placeIds = places.map((p) => p._id);

  const revenueByPlaceAgg = await BookingModel.aggregate([
    {
      $match: {
        placeId: { $in: placeIds },
        status: 'confirmed',
        checkOutDate: { $lt: new Date() }
      }
    },
    {
      $group: {
        _id: '$placeId',
        totalRevenue: { $sum: '$totalPrice' },
        totalBookings: { $sum: 1 }
      }
    }
  ]);

  const revenueByPlace = revenueByPlaceAgg.map((item) => {
    const place = places.find((p) => p._id.toString() === item._id.toString());
    return {
      placeId: item._id,
      placeName: place?.name || 'Không tìm thấy tên địa điểm',
      totalRevenue: item.totalRevenue,
      totalBookings: item.totalBookings
    };
  });

  const totalBookings = revenueByPlace.reduce(
    (acc, curr) => acc + curr.totalBookings,
    0
  );
  const totalRevenue = revenueByPlace.reduce(
    (acc, curr) => acc + curr.totalRevenue,
    0
  );
  const result = {
    totalPlaces: places.length,
    totalRevenue,
    totalBookings,
    revenueByPlace
  };
  return result;
};

const handleGetStatsByLocation = async (userId, from, to) => {
  const places = await PlaceModel.find({
    userId,
    deleted: false,
    isActive: true,
    isApprove: true
  }).lean();

  const match = {};
  if (from && to) {
    match.checkInDate = {
      $gte: new Date(from),
      $lte: new Date(to)
    };
  } else {
    match.checkOutDate = {
      $lt: new Date()
    };
  }
  if (!places.length) {
    return [];
  }
  const placeIds = places.map((p) => p._id);
  match.placeId = {
    $in: placeIds
  };
  match.status = 'confirmed';

  const revenueData = await BookingModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: '$checkInDate' },
          location: '$placeId'
        },
        totalRevenue: { $sum: '$totalPrice' }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
  const revenueDataPlaceName = revenueData.map((r) => {
    const place = places.find(
      (p) => p._id.toString() === r._id.location.toString()
    );
    return {
      month: r._id.month,
      location: place.name,
      totalRevenue: r.totalRevenue
    };
  });
  return revenueDataPlaceName;
};
module.exports = {
  handleGetStats,
  handleGetStatsByLocation
};
