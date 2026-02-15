const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Support multiple environment variable names for MongoDB URI
    const mongoUri = process.env.MONGO_URI ||
                     process.env.MONGODB_URL ||
                     process.env.MONGO_URL ||
                     process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error('MongoDB URI not found. Set MONGO_URI, MONGODB_URL, MONGO_URL, or DATABASE_URL');
    }

    // Append database name if not present
    const uri = mongoUri.includes('?')
      ? mongoUri
      : mongoUri.endsWith('/')
        ? `${mongoUri}event_booking_system`
        : `${mongoUri}/event_booking_system`;

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB Disconnected');
    });
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
