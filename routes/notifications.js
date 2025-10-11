const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get all notifications for current user
router.get('/', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const { limit = 50, skip = 0, unreadOnly = false, type } = req.query;
    
    const query = { recipientId: req.user.id };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    const total = await Notification.countDocuments(query);
    
    res.json({
      ok: true,
      notifications,
      unreadCount,
      total,
      hasMore: total > (parseInt(skip) + notifications.length)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({
      ok: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

// Mark notification as read
router.patch('/:id/read', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({
        ok: false,
        message: 'Notification not found'
      });
    }
    
    await notification.markAsRead();
    
    res.json({
      ok: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const count = await Notification.markAllAsRead(req.user.id);
    
    res.json({
      ok: true,
      message: `Marked ${count} notifications as read`,
      count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete notification
router.delete('/:id', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId: req.user.id
    });
    
    if (!result) {
      return res.status(404).json({
        ok: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      ok: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Delete all read notifications
router.delete('/read/all', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipientId: req.user.id,
      read: true
    });
    
    res.json({
      ok: true,
      message: `Deleted ${result.deletedCount} read notifications`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to delete read notifications',
      error: error.message
    });
  }
});

// Get notification statistics
router.get('/stats', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [total, unread, byType] = await Promise.all([
      Notification.countDocuments({ recipientId: userId }),
      Notification.countDocuments({ recipientId: userId, read: false }),
      Notification.aggregate([
        { $match: { recipientId: userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);
    
    res.json({
      ok: true,
      stats: {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch notification stats',
      error: error.message
    });
  }
});

module.exports = router;