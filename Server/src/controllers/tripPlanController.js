const { generateTripPlan } = require('../services/TripPlan');

async function generateTripPlanController(req, res) {
  try {
    const data = req.body;
    const tripPlan = await generateTripPlan(data);
    res.status(200).json(tripPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { generateTripPlanController };
