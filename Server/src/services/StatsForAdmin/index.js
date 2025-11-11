const PlaceModel = require('../../models/Place');
const UserModel = require('../../models/User');
const BookingModel = require('../../models/Booking');
const PaymentModel = require('../../models/Payment');
const ItineraryDetailModel = require('../../models/ItineraryDetail');
const dayjs = require('dayjs');
const handleGetStatsPlaceByType = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền truy cập.');
  }
  const data = await PlaceModel.aggregate([
    {
      $match: {
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
  const result = data.map((d) => ({
    _id:
      d._id === 'hotel'
        ? 'Địa điểm lưu trú'
        : d._id === 'cafe'
        ? 'Quán cafe'
        : d._id === 'restaurant'
        ? 'Địa điểm ăn uống'
        : 'Địa điểm du lịch',
    totalPlaces: d.totalPlaces || 0
  }));
  return result;
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

const handleGetFivePlacesHaveInItinerary = async (role, location) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền truy cập.');
  }
  let itineraryStats;
  if (!location) {
    itineraryStats = await ItineraryDetailModel.aggregate([
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
  } else {
    const placesByLocation = await PlaceModel.find({
      address: { $regex: location, $options: 'i' }
    });
    const placeIds = placesByLocation.map((p) => p._id);
    itineraryStats = await ItineraryDetailModel.aggregate([
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
      },
      { $limit: 5 }
    ]);
  }

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
  placesMap.sort((a, b) => b.total - a.total);
  return placesMap;
};

const handleGetStatsRevenueAndTransaction = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền thực hiện.');
  }
  const transactions = await PaymentModel.find({ amount: { $gt: 0 } });
  const revenues = await PaymentModel.find({ status: 'success' });
  const totalRevenues = revenues.reduce((act, curr) => {
    return act + curr?.amount;
  }, 0);
  const bookingCancels = await BookingModel.find({ status: 'cancelled' });
  const bookingCancelIds = bookingCancels.map((b) => b._id);
  const transactionsRefund = await PaymentModel.find({
    bookingId: { $in: bookingCancelIds },
    amount: { $gt: 0 }
  });
  return {
    totalTransactions: transactions.length || 0,
    totalRevenues,
    totalTransactionsRefunded: transactionsRefund.length || 0
  };
};
const handleGetStatsPlaceStatus = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền thực hiện.');
  }
  const placesApproved = await PlaceModel.find({ isApprove: true });
  const placesRejected = await PlaceModel.find({
    isApprove: false,
    $expr: { $ne: ['$createdAt', '$updatedAt'] }
  });
  const placesPendingApproved = await PlaceModel.find({
    isApprove: false,
    $expr: { $eq: ['$createdAt', '$updatedAt'] }
  });
  return {
    totalPlacesApproved: placesApproved.length || 0,
    totalPlacesRejected: placesRejected.length || 0,
    totalPlacesPendingApproved: placesPendingApproved.length || 0
  };
};
const handleGetFiveSupplierHaveManyPlaces = async (role) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền thực hiện.');
  }

  const suppliersGroup = await PlaceModel.aggregate([
    {
      $group: {
        _id: '$userId',
        totalPlaces: { $sum: 1 }
      }
    },
    {
      $sort: {
        totalPlaces: -1
      }
    },
    {
      $limit: 5
    }
  ]);
  const suppliers = await UserModel.find({ role: 'provider' })
    .select('fullName')
    .lean();

  const suppliersAndQuantity = suppliers.map((s) => {
    const supplier = suppliersGroup.find(
      (sg) => sg._id.toString() === s._id.toString()
    );
    if (!supplier) return null;
    return {
      ...s,
      ...supplier
    };
  });
  const result = suppliersAndQuantity.filter((s) => s !== null);
  return result;
};

const handleGetStatsRevenue = async (role, startMonth, endMonth) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền thực hiện.');
  }
  let stats;
  if (startMonth && endMonth) {
    stats = await PaymentModel.aggregate([
      {
        $match: {
          status: 'success',
          amount: { $gt: 0 },
          paymentDate: {
            $gte: new Date(startMonth),
            $lte: new Date(endMonth)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: { $toDate: '$paymentDate' } },
            year: { $year: { $toDate: '$paymentDate' } }
          },
          totalRevenue: { $sum: '$amount' },
          totalTransaction: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
  } else {
    stats = await PaymentModel.aggregate([
      {
        $match: {
          status: 'success',
          amount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: { $toDate: '$paymentDate' } },
            year: { $year: { $toDate: '$paymentDate' } }
          },
          totalRevenue: { $sum: '$amount' },
          totalTransaction: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
  }

  return stats;
};
const handleGetStatsSupplerHaveRevenueHigh = async (role, month, location) => {
  if (role !== 'admin') {
    throw new Error('Không có quyền thực hiện.');
  }
  let revenues;
  let places;
  let flagLocation = false;
  if (!month && !location) {
    revenues = await PaymentModel.find({
      amount: { $gt: 0 },
      status: { $ne: 'refunded' }
    }).populate('bookingId', 'placeId');
  } else if (!month && location) {
    revenues = await PaymentModel.find({
      amount: { $gt: 0 },
      status: { $ne: 'refunded' }
    }).populate('bookingId', 'placeId');
    flagLocation = true;
  } else if (month && !location) {
    const startOfMonth = dayjs()
      .month(month - 1)
      .startOf('month')
      .toDate();
    const endOfMonth = dayjs()
      .month(month - 1)
      .endOf('month')
      .toDate();
    revenues = await PaymentModel.find({
      amount: { $gt: 0 },
      paymentDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      },
      status: { $ne: 'refunded' }
    }).populate('bookingId', 'placeId');
  } else {
    const startOfMonth = dayjs()
      .month(month - 1)
      .startOf('month')
      .toDate();
    const endOfMonth = dayjs()
      .month(month - 1)
      .endOf('month')
      .toDate();
    revenues = await PaymentModel.find({
      amount: { $gt: 0 },
      paymentDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      },
      status: { $ne: 'refunded' }
    }).populate('bookingId', 'placeId');
    flagLocation = true;
  }
  const placeAndRevenue = revenues.map((r) => ({
    placeId: r.bookingId.placeId,
    revenue: r.amount
  }));
  const revenueByPlace = placeAndRevenue.reduce((acc, item) => {
    const id = item.placeId.toString();
    if (!acc[id]) acc[id] = 0;
    acc[id] += item.revenue;
    return acc;
  }, {});
  const placeIds = [...new Set(placeAndRevenue.map((p) => p.placeId))];
  if (!flagLocation) {
    places = await PlaceModel.find({ _id: { $in: placeIds } }).populate(
      'userId',
      '_id fullName'
    );
  } else {
    places = await PlaceModel.find({
      _id: { $in: placeIds },
      address: {
        $regex: location,
        $options: 'i'
      }
    }).populate('userId', '_id fullName');
  }

  const revenueBySupplier = places.reduce((acc, place) => {
    const supplierId = place.userId?._id?.toString();
    const supplierName = place.userId?.fullName;
    const revenue = revenueByPlace[place._id.toString()] || 0;
    if (!acc[supplierId]) {
      acc[supplierId] = {
        supplierId,
        supplierName,
        totalRevenue: 0,
        places: []
      };
    }
    acc[supplierId].totalRevenue += revenue;
    acc[supplierId].places.push({
      placeId: place._id,
      placeName: place.name,
      revenue
    });
    return acc;
  }, {});
  const topFiveSuppliers = Object.values(revenueBySupplier)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);
  return topFiveSuppliers;
};

module.exports = {
  handleGetStatsPlaceByType,
  handleGetUsersSevenDaysNewest,
  handleGetFivePlacesPopular,
  handleGetFivePlacesHaveInItinerary,
  handleGetStatsRevenueAndTransaction,
  handleGetStatsPlaceStatus,
  handleGetFiveSupplierHaveManyPlaces,
  handleGetStatsRevenue,
  handleGetStatsSupplerHaveRevenueHigh
};
