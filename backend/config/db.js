const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Suppress the strictQuery deprecation warning
    mongoose.set('strictQuery', false);
    
    if (!process.env.MONGO_URI) {
      console.warn('⚠️  MONGO_URI is not set in backend/.env. Database operations requiring MongoDB will not work until a connection string is provided.');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

module.exports = connectDB;
