// const Place = require('../../models/Place');
// const Hotel = require('../../models/Hotel');

// const getAllServicesOfUser = async (userId) => {
//   const places = await Place.find({ userId, deleted: false })
//     .select('_id name type isActive isApprove totalServices createdAt')
//     .lean();

//   const hotels = await Hotel.find({ userId, deleted: false })
//     .select('_id name isActive isApprove totalServices createdAt')
//     .lean();

//   // ép thêm type = 'hotel' cho hotel record
//   const hotelsWithType = hotels.map((h) => ({
//     ...h,
//     type: 'hotel'
//   }));

//   const merged = [...places, ...hotelsWithType].sort(
//     (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//   );
//   return { merged, message: 'Lấy danh sách địa điểm thành công' };
// };
// module.exports = { getAllServicesOfUser };
