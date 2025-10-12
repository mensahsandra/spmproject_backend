/**
 * Session Cleanup Service
 * 
 * Automatically removes expired attendance sessions from the database
 * to prevent stale session issues and maintain database hygiene.
 */

const mongoose = require('mongoose');
const { AttendanceSession } = require('../models/Attendance');

class SessionCleanupService {
    constructor() {
        this.cleanupInterval = null;
        this.isRunning = false;
    }

    /**
     * Start the automatic cleanup service
     * @param {number} intervalMinutes - How often to run cleanup (default: 5 minutes)
     */
    start(intervalMinutes = 5) {
        if (this.isRunning) {
            console.log('⚠️ [SESSION-CLEANUP] Service already running');
            return;
        }

        console.log(`🧹 [SESSION-CLEANUP] Starting automatic cleanup service (every ${intervalMinutes} minutes)`);
        
        // Run immediately on start
        this.runCleanup();
        
        // Then run at intervals
        this.cleanupInterval = setInterval(() => {
            this.runCleanup();
        }, intervalMinutes * 60 * 1000);
        
        this.isRunning = true;
    }

    /**
     * Stop the automatic cleanup service
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            this.isRunning = false;
            console.log('🛑 [SESSION-CLEANUP] Service stopped');
        }
    }

    /**
     * Run a single cleanup operation
     */
    async runCleanup() {
        try {
            // Only run if database is connected
            if (mongoose.connection?.readyState !== 1) {
                console.log('⚠️ [SESSION-CLEANUP] Database not connected, skipping cleanup');
                return;
            }

            const now = new Date();
            
            // Delete all expired sessions
            const result = await AttendanceSession.deleteMany({
                expiresAt: { $lte: now }
            });

            if (result.deletedCount > 0) {
                console.log(`🧹 [SESSION-CLEANUP] Removed ${result.deletedCount} expired session(s) at ${now.toISOString()}`);
            } else {
                console.log(`✅ [SESSION-CLEANUP] No expired sessions found at ${now.toISOString()}`);
            }

            return result.deletedCount;
        } catch (error) {
            console.error('❌ [SESSION-CLEANUP] Error during cleanup:', error.message);
            return 0;
        }
    }

    /**
     * Clean up sessions for a specific lecturer
     * @param {string} lecturerId - The lecturer's MongoDB ObjectId
     * @param {string} lecturerName - The lecturer's name (fallback)
     */
    async cleanupForLecturer(lecturerId, lecturerName) {
        try {
            if (mongoose.connection?.readyState !== 1) {
                console.log('⚠️ [SESSION-CLEANUP] Database not connected');
                return 0;
            }

            const now = new Date();
            
            const result = await AttendanceSession.deleteMany({
                $or: [
                    { lecturerId: lecturerId },
                    { lecturer: lecturerName }
                ],
                expiresAt: { $lte: now }
            });

            if (result.deletedCount > 0) {
                console.log(`🧹 [SESSION-CLEANUP] Removed ${result.deletedCount} expired session(s) for lecturer ${lecturerId}`);
            }

            return result.deletedCount;
        } catch (error) {
            console.error('❌ [SESSION-CLEANUP] Error cleaning lecturer sessions:', error.message);
            return 0;
        }
    }

    /**
     * Get count of expired sessions (for monitoring)
     */
    async getExpiredCount() {
        try {
            if (mongoose.connection?.readyState !== 1) {
                return 0;
            }

            const now = new Date();
            const count = await AttendanceSession.countDocuments({
                expiresAt: { $lte: now }
            });

            return count;
        } catch (error) {
            console.error('❌ [SESSION-CLEANUP] Error counting expired sessions:', error.message);
            return 0;
        }
    }

    /**
     * Get count of active sessions (for monitoring)
     */
    async getActiveCount() {
        try {
            if (mongoose.connection?.readyState !== 1) {
                return 0;
            }

            const now = new Date();
            const count = await AttendanceSession.countDocuments({
                expiresAt: { $gt: now }
            });

            return count;
        } catch (error) {
            console.error('❌ [SESSION-CLEANUP] Error counting active sessions:', error.message);
            return 0;
        }
    }
}

// Export singleton instance
module.exports = new SessionCleanupService();