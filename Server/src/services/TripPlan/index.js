const Place = require('../../models/Place');
const { prepareAIInput } = require('../../utils/tripPlan');
const { generateTripPlanWithAI } = require('./aiClientToGenerateTripPlan');

async function generateTripPlan(city, numDays) {
  const places = await Place.find({
    address: { $regex: cityToUse, $options: 'i' }
  });

  if (!places || places.length === 0) {
    return {
      message: 'No Result Of This City'
    };
  } else {
    const hotels = places.filter((p) => p.type === 'hotel');

    const aiInput = prepareAIInput(places, hotels, numDays);

    const tripPlan = await generateTripPlanWithAI(city, aiInput);

    return tripPlan;
  }
}

module.exports = { generateTripPlan };
