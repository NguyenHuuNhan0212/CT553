const {
  handleGetStatsPlaceByType,
  handleGetUsersSevenDaysNewest,
  handleGetFivePlacesPopular,
  handleGetFivePlacesHaveInItinerary,
  handleGetStatsRevenueAndTransaction,
  handleGetStatsPlaceStatus,
  handleGetFiveSupplierHaveManyPlaces,
  handleGetStatsRevenue,
  handleGetStatsSupplerHaveRevenueHigh
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
const getFivePlacesHaveInItinerary = async (req, res) => {
  try {
    const { role } = req.user;
    const { location } = req.query;
    const data = await handleGetFivePlacesHaveInItinerary(role, location);
    return res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStatsRevenueAndTransaction = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetStatsRevenueAndTransaction(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getStatsPlaceStatus = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetStatsPlaceStatus(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFiveSupplierHaveManyPlaces = async (req, res) => {
  try {
    const { role } = req.user;
    const result = await handleGetFiveSupplierHaveManyPlaces(role);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStatsRevenueForChart = async (req, res) => {
  try {
    const { role } = req.user;
    const { startMonth, endMonth } = req.query;
    const result = await handleGetStatsRevenue(role, startMonth, endMonth);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getStatsSupplierHaveRevenueHigh = async (req, res) => {
  try {
    const { role } = req.user;
    const { month, year, location } = req.query;
    const result = await handleGetStatsSupplerHaveRevenueHigh(
      role,
      month,
      year,
      location
    );
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  getStatsPlaceByType,
  getUsersSevenDaysNewest,
  getFivePlacesPopular,
  getFivePlacesHaveInItinerary,
  getStatsRevenueAndTransaction,
  getStatsPlaceStatus,
  getFiveSupplierHaveManyPlaces,
  getStatsRevenueForChart,
  getStatsSupplierHaveRevenueHigh
};
