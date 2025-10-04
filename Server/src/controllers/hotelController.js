// const {
//   addHotel,
//   getOneHotel,
//   getAllHotel,
//   getHotelsNearPlace,
//   removeHotel,
//   updateActiveHotel,
//   updateHotel,
//   getHotelRelative,
//   searchHotels,
//   getHotelDetail
// } = require('../services/Hotel');

// const addHotelController = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const data = req.body;
//     const imagePaths =
//       req.files?.map((file) => `uploads/${file.filename}`) || [];
//     const result = await addHotel(userId, {
//       ...data,
//       images: imagePaths
//     });
//     res.status(201).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const getInfoOneHotel = async (req, res) => {
//   try {
//     const { hotelId } = req.params;
//     const result = await getOneHotel(hotelId);
//     return res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// const getAll = async (req, res) => {
//   try {
//     const result = await getAllHotel();
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// const getHotelNearPlace = async (req, res) => {
//   try {
//     const { address } = req.query;
//     const result = await getHotelsNearPlace(address);
//     return res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// const getHotelRelativeByAddress = async (req, res) => {
//   try {
//     const { id, address } = req.query;
//     const result = await getHotelRelative(id, address);
//     return res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// const deleteHotel = async (req, res) => {
//   try {
//     const { userId } = req.user;
//     const { hotelId } = req.params;
//     const result = await removeHotel(userId, hotelId);
//     return res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// const updateStatusActive = async (req, res) => {
//   try {
//     const { userId } = req.user;
//     const { hotelId } = req.params;
//     const result = await updateActiveHotel(userId, hotelId);
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// const updateHotelController = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const hotelId = req.params.hotelId;
//     const data = req.body;

//     let finalImages = [];

//     if (data.images) {
//       if (Array.isArray(data.images)) {
//         finalImages = data.images.filter((img) => typeof img === 'string');
//       } else if (typeof data.images === 'string') {
//         finalImages = [data.images];
//       }
//     }

//     // Ảnh mới từ multer
//     if (req.files && req.files.length > 0) {
//       const newImages = req.files.map((file) => `uploads/${file.filename}`);
//       finalImages = [...finalImages, ...newImages];
//     }

//     data.images = finalImages;

//     const result = await updateHotel(hotelId, userId, data);
//     res.status(200).json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ message: err.message });
//   }
// };

// const getSearchHotels = async (req, res) => {
//   try {
//     const { location, checkIn, checkOut, guests } = req.query;
//     const result = await searchHotels(location, checkIn, checkOut, guests);
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// const getHotelDetailByReqUser = async (req, res) => {
//   try {
//     const { hotelId } = req.params;
//     const { checkIn, checkOut, guests } = req.query;
//     const result = await getHotelDetail(hotelId, checkIn, checkOut, guests);
//     return res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// module.exports = {
//   addHotelController,
//   getInfoOneHotel,
//   getAll,
//   getHotelNearPlace,
//   deleteHotel,
//   getHotelRelativeByAddress,
//   updateStatusActive,
//   updateHotelController,
//   getSearchHotels,
//   getHotelDetailByReqUser
// };
