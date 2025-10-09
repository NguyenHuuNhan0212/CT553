const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'provider', 'admin'],
      default: 'user'
    },
    phone: { type: String, required: true },
    avatarUrl: { type: String, default: '' }
  },
  { timestamps: true }
);
module.exports = mongoose.model('User', userSchema);
