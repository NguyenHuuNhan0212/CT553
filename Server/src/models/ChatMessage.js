const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  role: { type: String, enum: ['user', 'assistant'] },
  content: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ChatMessage', schema);
