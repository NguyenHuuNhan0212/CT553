const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String
  },
  { timestamps: true }
);
module.exports = mongoose.model('Address', addressSchema);
