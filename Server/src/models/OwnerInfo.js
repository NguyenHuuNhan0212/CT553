const mongoose = require('mongoose');

const ownerInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bankAccount: { type: String, required: true },
    bankName: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OwnerInfo', ownerInfoSchema);
