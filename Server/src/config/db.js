const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (e) {
    console.error('MongoDB connection error', e.message);
    process.exit(1);
  }
}

module.exports = connectDB;
