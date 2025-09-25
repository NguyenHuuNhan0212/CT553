const {
  addPlace,
  getAllPlaceOffUserById,
  getInfoOnePlace
} = require('../controllers/placeController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
router.post('/', verifyToken, upload.array('images'), addPlace);
router.get('/', verifyToken, getAllPlaceOffUserById);
router.get('/:placeId', getInfoOnePlace);
module.exports = router;
