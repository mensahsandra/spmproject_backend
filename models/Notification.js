const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipientRole: {
    type: String,
    enum: ['student', 'lecturer', 'admin'],
    required: true,
    index: true
  },
  
  // Notification content
  type: {
    type: String,
    enum: [
      'quiz_created',
      'quiz_submitted',
      'quiz_graded',
      'attendance_scan',
      'attendance_session_created',
      'grade_updated',
      'deadline_reminder',
      'system_announcement'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Related entities
  relatedQuizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  relatedSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizSubmission'
  },
  relatedCourseCode: {
    type: String
  },
  relatedSessionCode: {
    type: String
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Status
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  
  // Action link (optional)
  actionUrl: {
    type: String
  },
  actionLabel: {
    type: String
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });

// Auto-delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = await this.create(data);
    console.log('✅ Notification created:', notification._id, 'for user:', data.recipientId);
    return notification;
  } catch (error) {
    console.error('❌ Failed to create notification:', error.message);
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipientId: userId, read: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { recipientId: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return result.modifiedCount;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;