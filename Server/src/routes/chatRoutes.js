const express = require('express');
const { ask } = require('../controllers/chatController.js');
const r = express.Router();
r.post('/ask', ask);
module.exports = r;
