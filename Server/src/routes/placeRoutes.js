const { addPlace } = require('../controllers/placeController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
router.post('/', verifyToken, upload.array('images'), addPlace);
module.exports = router;
