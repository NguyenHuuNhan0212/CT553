const mongoose = require('mongoose');

const ownerInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    cardHolderName: { type: String, required: true },
    cardNumber: { type: String, required: true },
    bankAccount: { type: String, required: true },
    bankName: { type: String, required: true },
    isApprove: { type: Boolean, required: true, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OwnerInfo', ownerInfoSchema);
