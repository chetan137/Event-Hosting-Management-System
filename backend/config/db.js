const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('\n❌ ERROR: MONGO_URI is not defined in your .env file!');
      console.error('👉 Please create a .env file with your MongoDB connection string:');
      console.error('   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/event_management\n');
      process.exit(1);
    }

    // Suppress the strictQuery deprecation warning
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
