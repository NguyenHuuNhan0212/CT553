const MessageModel = require('../models/Message.js');
const express = require('express');
const { ask } = require('../controllers/chatController.js');
const r = express.Router();
// Lấy tất cả message giữa 2 user
r.get('/:placeId/:userId/:friendId', async (req, res) => {
  const { userId, friendId, placeId } = req.params;
  const messages = await MessageModel.find({
    placeId: { $eq: placeId },
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId }
    ]
  }).sort({ createdAt: 1 });
  res.json(messages);
});

module.exports = r;
