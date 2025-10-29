const {
  handleGetStatsPlaceByType,
  handleGetUsersSevenDaysNewest,
  handleGetFivePlacesPopular
} = require('../services/StatsForAdmin');

const getStatsPlaceByType = async (req, res) => {
  try {
    const { role } = req.user;
    const data = await handleGetStatsPlaceByType(role);
    return res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getUsersSevenDaysNewest = async (req, res) => {
  try {
    const { role } = req.user;
    const data = await handleGetUsersSevenDaysNewest(role);
    return res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFivePlacesPopular = async (req, res) => {
  try {
    const { role } = req.user;
    const data = await handleGetFivePlacesPopular(role);
    return res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  getStatsPlaceByType,
  getUsersSevenDaysNewest,
  getFivePlacesPopular
};
