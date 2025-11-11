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
        placeId: { $in: placeIds }
      }
    },
    {
      $lookup: {
        from: 'payments',
        let: { bookingId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$bookingId', '$$bookingId'] } } },
          { $match: { status: { $ne: 'refunded' }, amount: { $gt: 0 } } },
          { $match: { paymentDate: { $lte: new Date() } } }
        ],
        as: 'payments'
      }
    },
    {
      $match: {
        'payments.0': { $exists: true }
      }
    },
    {
      $addFields: {
        totalRevenue: { $sum: '$payments.amount' }
      }
    },
    {
      $group: {
        _id: '$placeId',
        totalRevenue: { $sum: '$totalRevenue' },
        totalBookings: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  const revenueByPlace = revenueByPlaceAgg.map((item) => {
    const place = places.find((p) => p._id.toString() === item._id.toString());
    return {
      placeId: item._id,
      placeName: place?.name || 'Không tìm thấy tên địa điểm',
      totalRevenue: item.totalRevenue || 0,
      totalBookings: item.totalBookings || 0
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

  return {
    totalPlaces: places.length,
    totalRevenue,
    totalBookings,
    revenueByPlace
  };
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
    match.checkOutDate = {
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

  const revenueData = await BookingModel.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'payments',
        let: { bookingId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$bookingId', '$$bookingId'] } } },
          { $match: { status: { $ne: 'refunded' }, amount: { $gt: 0 } } }
        ],
        as: 'payments'
      }
    },
    {
      $match: { 'payments.0': { $exists: true } }
    },
    {
      $addFields: { totalRevenue: { $sum: '$payments.amount' } }
    },
    {
      $group: {
        _id: {
          month: { $month: '$checkOutDate' },
          year: { $year: '$checkOutDate' },
          location: '$placeId'
        },
        totalRevenue: { $sum: '$totalRevenue' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  const revenueDataPlaceName = revenueData.map((r) => {
    const place = places.find(
      (p) => p._id.toString() === r._id.location.toString()
    );
    return {
      month: r._id.month,
      year: r._id.year,
      location: place.name,
      totalRevenue: r.totalRevenue
    };
  });
  return revenueDataPlaceName;
};

const handleGetRevenueByDate = async (userId, date) => {
  const places = await PlaceModel.find({
    userId,
    deleted: false,
    isActive: true,
    isApprove: true
  }).lean();

  if (!places.length) return [];

  const match = {
    placeId: { $in: places.map((p) => p._id) }
  };

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    match.checkOutDate = { $gte: start, $lte: end };
  } else {
    match.checkOutDate = {
      $lt: new Date()
    };
  }

  const revenueData = await BookingModel.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'payments',
        let: { bookingId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$bookingId', '$$bookingId'] } } },
          { $match: { status: { $ne: 'refunded' }, amount: { $gt: 0 } } }
        ],
        as: 'payments'
      }
    },
    {
      $match: { 'payments.0': { $exists: true } }
    },
    {
      $addFields: { totalRevenue: { $sum: '$payments.amount' } }
    },
    {
      $group: {
        _id: '$placeId',
        totalRevenue: { $sum: '$totalRevenue' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  return revenueData.map((r) => {
    const place = places.find((p) => p._id.toString() === r._id.toString());
    return {
      location: place?.name || 'Không xác định',
      totalRevenue: r.totalRevenue
    };
  });
};

module.exports = {
  handleGetStats,
  handleGetStatsByLocation,
  handleGetRevenueByDate
};
