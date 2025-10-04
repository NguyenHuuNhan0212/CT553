const {
  addPlace,
  getInfoOnePlace,
  getAll,
  getPlaceRelativeByTypeAndAddress,
  deletePlace,
  updateStatusActive,
  updatePlace,
  getAllByUserId
} = require('../controllers/placeController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
router.post('/', verifyToken, upload.array('images'), addPlace);
router.get('/my-services', verifyToken, getAllByUserId);
router.get('/relative', getPlaceRelativeByTypeAndAddress);
router.get('/:placeId', getInfoOnePlace);
router.patch('/update-status-active/:placeId', verifyToken, updateStatusActive);
router.put('/:placeId', verifyToken, upload.array('images'), updatePlace);
router.delete('/:placeId', verifyToken, deletePlace);
router.get('/', getAll);
module.exports = router;
