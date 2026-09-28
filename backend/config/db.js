const mongoose = require('mongoose');
let mongodInstance = null;

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);

    let mongoUri = process.env.MONGO_URI;

    // If MONGO_URI is missing or contains placeholder cluster0 string, auto-launch local MongoMemoryServer
    if (!mongoUri || mongoUri.includes('cluster0.mongodb.net') || mongoUri.includes('<username>')) {
      console.log('⚡ No live MongoDB Atlas connection string configured in .env.');
      console.log('🚀 Starting local embedded MongoDB server for instant development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create({
          instance: {
            dbName: 'event_management'
          }
        });
        mongoUri = mongodInstance.getUri();
        process.env.MONGO_URI = mongoUri;
        console.log(`✅ Local embedded MongoDB started at: ${mongoUri}`);
      } catch (localDbErr) {
        console.error('Failed to start local MongoDB:', localDbErr.message);
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed events if database is empty so frontend has full data immediately
    const Event = require('../models/Event');
    const eventCount = await Event.countDocuments({ visibility: 'public' });
    if (eventCount === 0) {
      console.log('🌱 Database is empty. Auto-seeding catalog with realistic events...');
      try {
        const seedDatabase = require('../seed-events');
        await seedDatabase(false);
        console.log('✅ Auto-seeding complete! Events are now visible.');
      } catch (seedErr) {
        console.warn('Auto-seeding notice:', seedErr.message);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
