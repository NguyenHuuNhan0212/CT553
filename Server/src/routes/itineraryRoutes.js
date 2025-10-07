const { createItinerary } = require('../controllers/itineraryController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
router.post('/', verifyToken, createItinerary);

module.exports = router;
