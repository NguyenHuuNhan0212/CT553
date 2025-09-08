const express = require('express');
const {
  generateTripPlanController
} = require('../controllers/tripPlanController');

const router = express.Router();

router.post('/generate', generateTripPlanController);

module.exports = router;
