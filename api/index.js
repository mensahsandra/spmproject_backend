// Vercel serverless function entry that wraps the existing Express app
// and restores the "/api" prefix (Vercel strips it for functions under /api)

const app = require('../app');
const connectDB = require('../config/db');

let dbPromise;
async function ensureDb() {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      console.warn('DB connect failed in serverless environment:', err?.message || err);
      return null; // allow running in memory mode
    });
  }
  return dbPromise;
}

module.exports = async (req, res) => {
  // Ensure Express sees /api/* routes as defined in app.js.
  // Only prefix if the path doesn't already start with /api (covers /api and /api/*).
  if (!req.url.startsWith('/api')) {
    // Normalise leading slash
    if (!req.url.startsWith('/')) req.url = '/' + req.url;
    req.url = '/api' + req.url;
  }

  // Warm-up / ensure a DB connection if possible (cached across invocations)
  await ensureDb();

  // Delegate to Express app (no .listen() in serverless)
  return app(req, res);
};
