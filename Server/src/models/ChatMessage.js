// models/ChatMessage.js
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    userId: String,
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: String,
    category: String,
    city: String,
    awaitingDays: Boolean
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
