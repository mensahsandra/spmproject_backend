const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  courseCode: { type: String, required: true, index: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lecturerName: { type: String, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  dueDate: { type: Date }, // Keep for backward compatibility
  maxScore: { type: Number, default: 100 },
  instructions: { type: String },
  questions: [{
    type: { type: String, enum: ['text', 'multiple_choice', 'essay', 'file_upload'], default: 'text' },
    question: { type: String, required: true },
    options: [String], // For multiple choice questions
    correctAnswer: String, // For auto-grading
    points: { type: Number, default: 1 },
    required: { type: Boolean, default: true }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  restrictToAttendees: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  notificationSent: { type: Boolean, default: false },
  allowedSubmissionTypes: [{
    type: String,
    enum: ['text', 'file', 'image', 'scan'],
    default: ['text', 'file', 'image']
  }]
}, { timestamps: true });

QuizSchema.index({ courseCode: 1, createdAt: -1 });
QuizSchema.index({ lecturer: 1, createdAt: -1 });

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);