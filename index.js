
//index.js
// Start the Express server on port 3000 or the port specified in .env
// Import necessary modules and files
const express = require("express");
const connectDB = require("./config/db");
const app = require("./app"); // Import the Express application
const sessionCleanupService = require("./services/sessionCleanupService");
// Remove reference to ensureDefaultUsers if it doesn't exist
require("dotenv").config();

// Set the port for the server - always default to 3000 for consistency
const PORT = process.env.PORT || 3000;

// Connect to MongoDB asynchronously with proper error handling
const startServer = async () => {
  try {
    console.log("Starting Student Performance Matrix backend server...");
    
    // Connect to MongoDB
    const conn = await connectDB();
    console.log("Database connection established");
    
    // Start automatic session cleanup service (runs every 5 minutes)
    sessionCleanupService.start(5);
    console.log("Session cleanup service started");
    
    // Remove ensureDefaultUsers since it's not available
    
    // Start the server after DB connection
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server properly:", error.message);
    console.log("Server will start without full database functionality");
    
    // Start server even if DB connection fails
    app.listen(PORT, () => {
      console.log(`⚠️ Server running in limited mode on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
    });
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  sessionCleanupService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  sessionCleanupService.stop();
  process.exit(0);
});

// Start the server
startServer();
