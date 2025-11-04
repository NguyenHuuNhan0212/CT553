const {
  searchHotels,
  searchHotelByAddress,
  getHotelDetail
} = require('../services/Hotel');

const getSearchHotels = async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests } = req.query;
    let result = null;
    if (location && !checkIn && !checkOut) {
      result = await searchHotelByAddress(location);
    } else {
      result = await searchHotels(location, checkIn, checkOut, guests);
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getHotelDetailByReqUser = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut, guests } = req.query;
    const result = await getHotelDetail(hotelId, checkIn, checkOut, guests);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  //   addHotelController,
  //   getInfoOneHotel,
  //   getAll,
  //   getHotelNearPlace,
  //   deleteHotel,
  //   getHotelRelativeByAddress,
  //   updateStatusActive,
  //   updateHotelController,
  getSearchHotels,
  getHotelDetailByReqUser
};
