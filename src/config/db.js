const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://db:27017/membership';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = connectDB;
