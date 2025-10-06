const mongoose = require('mongoose');

const QuizSubmissionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  submissionFiles: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  submissionText: { type: String },
  submittedAt: { type: Date, default: Date.now },
  score: { type: Number },
  grade: { type: String },
  feedback: { type: String },
  gradedAt: { type: Date },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

QuizSubmissionSchema.index({ quiz: 1, student: 1 }, { unique: true });
QuizSubmissionSchema.index({ quiz: 1, submittedAt: -1 });

module.exports = mongoose.models.QuizSubmission || mongoose.model('QuizSubmission', QuizSubmissionSchema);