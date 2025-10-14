const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    relatedQuizId = null,
    relatedSubmissionId = null,
    relatedCourseCode = null,
    relatedSessionCode = null,
    metadata = {},
    actionUrl = null,
    actionLabel = null,
    priority = 'normal',
    expiresAt = null
  }) {
    try {
      const notification = await Notification.create({
        recipientId,
        recipientRole,
        type,
        title,
        message,
        relatedQuizId,
        relatedSubmissionId,
        relatedCourseCode,
        relatedSessionCode,
        metadata,
        actionUrl,
        actionLabel,
        priority,
        expiresAt
      });

      console.log(`✅ Notification created: ${type} for user ${recipientId}`);
      return notification;
    } catch (error) {
      console.error('❌ Failed to create notification:', error.message);
      throw error;
    }
  }

  /**
   * Notify students when a quiz is created
   */
  static async notifyQuizCreated(quiz, lecturerId) {
    try {
      // Find all students enrolled in the course
      const students = await User.find({
        role: 'student',
        courses: quiz.courseCode
      }).select('_id name');

      console.log(`📢 Notifying ${students.length} students about new quiz: ${quiz.title}`);

      const notifications = students.map(student => ({
        recipientId: student._id,
        recipientRole: 'student',
        type: 'quiz_created',
        title: 'New Quiz Available',
        message: `A new quiz "${quiz.title}" has been created for ${quiz.courseCode}`,
        relatedQuizId: quiz._id,
        relatedCourseCode: quiz.courseCode,
        metadata: {
          quizTitle: quiz.title,
          courseCode: quiz.courseCode,
          courseName: quiz.courseName,
          dueDate: quiz.dueDate,
          duration: quiz.duration
        },
        actionUrl: `/student/assessment`,
        actionLabel: 'Take Quiz',
        priority: 'high'
      }));

      const created = await Notification.insertMany(notifications);
      console.log(`✅ Created ${created.length} quiz notifications`);
      
      return created;
    } catch (error) {
      console.error('❌ Failed to notify students about quiz:', error.message);
      throw error;
    }
  }

  /**
   * Notify lecturer when a student scans QR code
   */
  static async notifyAttendanceScan(attendanceLog, lecturerId) {
    try {
      if (!lecturerId) {
        console.warn('⚠️ No lecturerId provided for attendance scan notification');
        return null;
      }

      const notification = await this.createNotification({
        recipientId: lecturerId,
        recipientRole: 'lecturer',
        type: 'attendance_scan',
        title: 'Student Checked In',
        message: `${attendanceLog.studentName || attendanceLog.studentId} checked in to ${attendanceLog.courseCode}`,
        relatedCourseCode: attendanceLog.courseCode,
        relatedSessionCode: attendanceLog.sessionCode,
        metadata: {
          studentId: attendanceLog.studentId,
          studentName: attendanceLog.studentName,
          courseCode: attendanceLog.courseCode,
          courseName: attendanceLog.courseName,
          timestamp: attendanceLog.timestamp,
          centre: attendanceLog.centre
        },
        actionUrl: `/lecturer/attendance`,
        actionLabel: 'View Attendance',
        priority: 'normal'
      });

      return notification;
    } catch (error) {
      console.error('❌ Failed to notify lecturer about attendance scan:', error.message);
      throw error;
    }
  }

  /**
   * Notify student and lecturer when quiz is submitted
   */
  static async notifyQuizSubmitted(submission, quiz, studentId, lecturerId) {
    try {
      const notifications = [];

      // Get student info
      const student = await User.findById(studentId).select('name');

      // Notify student
      const studentNotification = await this.createNotification({
        recipientId: studentId,
        recipientRole: 'student',
        type: 'quiz_submitted',
        title: 'Quiz Submitted Successfully',
        message: `Your submission for "${quiz.title}" has been received and is awaiting grading`,
        relatedQuizId: quiz._id,
        relatedSubmissionId: submission._id,
        relatedCourseCode: quiz.courseCode,
        metadata: {
          quizTitle: quiz.title,
          courseCode: quiz.courseCode,
          submittedAt: submission.submittedAt,
          status: submission.status
        },
        actionUrl: `/student/notifications?tab=notifications`,
        actionLabel: 'View Details',
        priority: 'normal'
      });
      notifications.push(studentNotification);

      // Notify lecturer
      if (lecturerId) {
        const lecturerNotification = await this.createNotification({
          recipientId: lecturerId,
          recipientRole: 'lecturer',
          type: 'quiz_submitted',
          title: 'New Quiz Submission',
          message: `${student?.name || 'A student'} submitted "${quiz.title}" for ${quiz.courseCode}`,
          relatedQuizId: quiz._id,
          relatedSubmissionId: submission._id,
          relatedCourseCode: quiz.courseCode,
          metadata: {
            studentId: studentId,
            studentName: student?.name,
            quizTitle: quiz.title,
            courseCode: quiz.courseCode,
            submittedAt: submission.submittedAt
          },
          actionUrl: `/lecturer/assessment`,
          actionLabel: 'Grade Submission',
          priority: 'high'
        });
        notifications.push(lecturerNotification);
      }

      console.log(`✅ Created ${notifications.length} quiz submission notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Failed to notify about quiz submission:', error.message);
      throw error;
    }
  }

  /**
   * Notify student when quiz is graded
   */
  static async notifyQuizGraded(submission, quiz, studentId, lecturerId) {
    try {
      const notifications = [];

      // Notify student
      const studentNotification = await this.createNotification({
        recipientId: studentId,
        recipientRole: 'student',
        type: 'quiz_graded',
        title: 'Quiz Graded',
        message: `Your submission for "${quiz.title}" has been graded. Score: ${submission.score}/${submission.totalScore}`,
        relatedQuizId: quiz._id,
        relatedSubmissionId: submission._id,
        relatedCourseCode: quiz.courseCode,
        metadata: {
          quizTitle: quiz.title,
          courseCode: quiz.courseCode,
          score: submission.score,
          totalScore: submission.totalScore,
          percentage: submission.percentage,
          feedback: submission.feedback,
          gradedAt: submission.gradedAt
        },
        actionUrl: `/student/notifications?tab=notifications`,
        actionLabel: 'View Results',
        priority: 'high'
      });
      notifications.push(studentNotification);

      // Notify lecturer (confirmation)
      if (lecturerId) {
        const lecturerNotification = await this.createNotification({
          recipientId: lecturerId,
          recipientRole: 'lecturer',
          type: 'quiz_graded',
          title: 'Grading Completed',
          message: `You graded "${quiz.title}" for a student in ${quiz.courseCode}`,
          relatedQuizId: quiz._id,
          relatedSubmissionId: submission._id,
          relatedCourseCode: quiz.courseCode,
          metadata: {
            quizTitle: quiz.title,
            courseCode: quiz.courseCode,
            score: submission.score,
            totalScore: submission.totalScore
          },
          actionUrl: `/lecturer/notifications`,
          actionLabel: 'View Details',
          priority: 'normal'
        });
        notifications.push(lecturerNotification);
      }

      console.log(`✅ Created ${notifications.length} quiz grading notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Failed to notify about quiz grading:', error.message);
      throw error;
    }
  }

  /**
   * Notify lecturer when attendance session is created
   */
  static async notifySessionCreated(session, lecturerId) {
    try {
      const notification = await this.createNotification({
        recipientId: lecturerId,
        recipientRole: 'lecturer',
        type: 'attendance_session_created',
        title: 'Attendance Session Created',
        message: `Session created for ${session.courseCode} - Code: ${session.sessionCode}`,
        relatedCourseCode: session.courseCode,
        relatedSessionCode: session.sessionCode,
        metadata: {
          sessionCode: session.sessionCode,
          courseCode: session.courseCode,
          courseName: session.courseName,
          expiresAt: session.expiresAt
        },
        actionUrl: `/lecturer/attendance`,
        actionLabel: 'View Session',
        priority: 'normal'
      });

      return notification;
    } catch (error) {
      console.error('❌ Failed to notify about session creation:', error.message);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error('❌ Failed to get unread count:', error.message);
      return 0;
    }
  }

  /**
   * Notify students when a new assessment is created
   */
  static async notifyAssessmentCreated(assessment, lecturerId) {
    try {
      console.log(`📢 Creating assessment notifications for course: ${assessment.courseCode}`);
      
      // Get students enrolled in this course
      const students = await User.find({ 
        role: 'student',
        courses: assessment.courseCode 
      }).select('_id name');

      console.log(`👥 Found ${students.length} students enrolled in ${assessment.courseCode}`);
      
      const notifications = [];

      // Notify each enrolled student
      for (const student of students) {
        const studentNotification = await this.createNotification({
          recipientId: student._id,
          recipientRole: 'student',
          type: 'assessment_created',
          title: 'New Assessment Available',
          message: `New assessment "${assessment.title}" has been created for ${assessment.courseCode}`,
          relatedQuizId: assessment._id,
          relatedCourseCode: assessment.courseCode,
          metadata: {
            assessmentTitle: assessment.title,
            courseCode: assessment.courseCode,
            courseName: assessment.courseName,
            lecturerName: assessment.lecturer,
            createdAt: assessment.createdAt,
            type: assessment.type || 'assessment',
            hasDeadline: !!assessment.deadline
          },
          actionUrl: `/student/assessment`,
          actionLabel: 'View Assessment',
          priority: 'high',
          expiresAt: assessment.deadline ? new Date(assessment.deadline) : null
        });
        notifications.push(studentNotification);
      }

      // Notify lecturer (confirmation)
      if (lecturerId) {
        const lecturerNotification = await this.createNotification({
          recipientId: lecturerId,
          recipientRole: 'lecturer',
          type: 'assessment_created',
          title: 'Assessment Created Successfully',
          message: `Assessment "${assessment.title}" has been created and students have been notified`,
          relatedQuizId: assessment._id,
          relatedCourseCode: assessment.courseCode,
          metadata: {
            assessmentTitle: assessment.title,
            courseCode: assessment.courseCode,
            studentsNotified: students.length,
            createdAt: assessment.createdAt
          },
          actionUrl: `/lecturer/assessment`,
          actionLabel: 'View Assessment',
          priority: 'normal'
        });
        notifications.push(lecturerNotification);
      }

      console.log(`✅ Created ${notifications.length} assessment notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Failed to notify about assessment creation:', error.message);
      throw error;
    }
  }

  /**
   * Notify lecturer when student submits assessment
   */
  static async notifyAssessmentSubmitted(assessment, submission, studentId, lecturerId) {
    try {
      const student = await User.findById(studentId).select('name studentId');
      
      if (!lecturerId) {
        console.warn('⚠️ No lecturerId provided for assessment submission notification');
        return null;
      }

      const notification = await this.createNotification({
        recipientId: lecturerId,
        recipientRole: 'lecturer',
        type: 'assessment_submitted',
        title: 'Assessment Submitted',
        message: `${student?.name || 'Student'} (${student?.studentId || studentId}) submitted "${assessment.title}"`,
        relatedQuizId: assessment._id,
        relatedSubmissionId: submission._id,
        relatedCourseCode: assessment.courseCode,
        metadata: {
          studentId: studentId,
          studentName: student?.name,
          studentIdNumber: student?.studentId,
          assessmentTitle: assessment.title,
          courseCode: assessment.courseCode,
          submittedAt: submission.submittedAt,
          submissionId: submission._id
        },
        actionUrl: `/lecturer/assessment`,
        actionLabel: 'Review Submission',
        priority: 'high'
      });

      console.log(`✅ Assessment submission notification sent to lecturer`);
      return notification;
    } catch (error) {
      console.error('❌ Failed to notify lecturer about assessment submission:', error.message);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipientId: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();
      return notification;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error.message);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    try {
      return await Notification.markAllAsRead(userId);
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error.message);
      throw error;
    }
  }
}

module.exports = NotificationService;