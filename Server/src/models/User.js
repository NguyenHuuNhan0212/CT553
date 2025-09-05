const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema(
  {
    userId: { type: Number, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' }
  },
  { timestamps: true }
);
userSchema.plugin(AutoIncrement, { inc_field: 'userId', start_seq: 1000 });
module.exports = mongoose.model('User', userSchema);
