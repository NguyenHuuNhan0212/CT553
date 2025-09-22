const { generateTripPlan } = require('../services/TripPlan');

async function generateTripPlanController(req, res) {
  try {
    const { city, numDays } = req.body;
    if (!city || !numDays) {
      return res.status(400).json({ msg: 'Thiếu city hoặc numDays' });
    }

    const tripPlan = await generateTripPlan(city, numDays);
    res.json(tripPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Lỗi khi tạo lịch trình' });
  }
}

module.exports = { generateTripPlanController };
