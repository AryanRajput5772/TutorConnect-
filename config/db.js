const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutorconnect';

// Global cache to persist connections across Vercel serverless function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected and active, return cached connection immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 5, // Cap connection pool for serverless lambdas (prevents Atlas 500 connection limit)
      minPoolSize: 0, // Allow idle sockets to close
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log(` MongoDB Connected: ${m.connection.host}/${m.connection.name}`);
      return m.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error(' MongoDB Connection Error:', e.message);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
