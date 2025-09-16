const mongoose = require('mongoose');
const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: { type: String, required: true },
    type: {
      type: String,
      enum: ['refreshToken', 'resetPassword'],
      required: true
    },
    expiry: { type: Date }
  },
  { timestamps: true }
);
module.exports = mongoose.model('Token', tokenSchema);
