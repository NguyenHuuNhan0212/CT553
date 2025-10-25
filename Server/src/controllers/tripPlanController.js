const { generateTripPlan } = require('../services/TripPlan');

async function generateTripPlanController(req, res) {
  try {
    const data = req.body;
    const tripPlan = await generateTripPlan(data);
    res.status(200).json(tripPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Lỗi khi tạo lịch trình' });
  }
}

module.exports = { generateTripPlanController };
