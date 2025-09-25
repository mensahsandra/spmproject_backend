// config/db.js
require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');

// Support both MONGO_URI and Vercel-provided MONGODB_URI
const DEFAULT_URI = 'mongodb+srv://sandramensah243_db_user:BLfftPv57vGS28sr@studentmatrix0.39egn6a.mongodb.net/students-performance-db?retryWrites=true&w=majority&appName=StudentMatrixApp';

let cached = global.__MONGOOSE_CONN__;
if (!cached) {
    cached = global.__MONGOOSE_CONN__ = { conn: null, promise: null };
}

async function connectDB() {
    const dbUrl = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_URI;
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        console.log('Attempting to connect to MongoDB', dbUrl.includes('mongodb+srv://') ? 'Atlas SRV' : 'instance');
        cached.promise = mongoose
            .connect(dbUrl, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000
            })
            .then((mongooseInstance) => {
                console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
                console.log(`DB Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
                console.log(`DB Name: ${mongoose.connection.name || 'Not available'}`);
                return mongooseInstance;
            })
            .catch((err) => {
                console.error('MongoDB connection failed:', err.message);
                console.warn('Continuing without database connection - using in-memory data only');
                throw err;
            });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        // leave cached.conn null so future attempts can retry if needed
        throw e;
    }
    return cached.conn;
}

module.exports = connectDB;