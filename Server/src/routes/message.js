const MessageModel = require('../models/Message.js');
const express = require('express');
const { ask } = require('../controllers/chatController.js');
const r = express.Router();
const verifyToken = require('../middlewares/authMiddleware.js');
// Lấy tất cả message giữa 2 user
r.get('/:userId/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  const messages = await MessageModel.find({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId }
    ]
  }).sort({ createdAt: 1 });
  res.json(messages);
});

module.exports = r;
