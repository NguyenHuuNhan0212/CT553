const {
  handleGetStats,
  handleGetStatsByLocation,
  handleGetRevenueByDate
} = require('../services/Stats/index');

const getStats = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await handleGetStats(userId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStatsByLocation = async (req, res) => {
  try {
    const { from, to } = req.query;
    const { userId } = req.user;
    const result = await handleGetStatsByLocation(userId, from, to);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getRevenueByDate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { date } = req.query;
    const result = await handleGetRevenueByDate(userId, date);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  getStats,
  getStatsByLocation,
  getRevenueByDate
};
