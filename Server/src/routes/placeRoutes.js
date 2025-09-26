const {
  addPlace,
  getAllPlaceOffUserById,
  getInfoOnePlace,
  getAll,
  getPlaceRelativeByTypeAndAddress,
  deletePlace,
  updateStatusActive
} = require('../controllers/placeController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
router.post('/', verifyToken, upload.array('images'), addPlace);
router.get('/user', verifyToken, getAllPlaceOffUserById);
router.get('/relative', getPlaceRelativeByTypeAndAddress);
router.get('/:placeId', getInfoOnePlace);
router.patch('/:placeId', verifyToken, updateStatusActive);
router.delete('/:placeId', verifyToken, deletePlace);
router.get('/', getAll);
module.exports = router;
