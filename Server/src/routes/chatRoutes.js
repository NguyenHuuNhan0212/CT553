const express = require('express');
const { ask } = require('../controllers/chatController.js');
const r = express.Router();
const verifyToken = require('../middlewares/authMiddleware.js');
r.post('/ask', verifyToken, ask);
module.exports = r;
