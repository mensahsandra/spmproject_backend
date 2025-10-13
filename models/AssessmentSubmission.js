const mongoose = require('mongoose');
const { AssessmentTypeValues } = require('../constants/assessmentTypes');

const AnswerSchema = new mongoose.Schema({
  questionId: String,
  response: mongoose.Schema.Types.Mixed,
  score: Number,
  feedback: String
}, { _id: false });

const SubmissionFileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  mimetype: String
}, { _id: false });

const AssessmentSubmissionSchema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  assessmentType: { type: String, enum: AssessmentTypeValues, required: true },
  courseCode: { type: String, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  answers: [AnswerSchema],
  submissionText: String,
  submissionFiles: [SubmissionFileSchema],
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded', 'late', 'missing'], default: 'submitted' },
  score: Number,
  maxScore: Number,
  grade: String,
  feedback: String,
  gradedAt: Date,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedByName: String
}, { timestamps: true });

AssessmentSubmissionSchema.index({ assessment: 1, student: 1 }, { unique: true });
AssessmentSubmissionSchema.index({ courseCode: 1, studentId: 1 });

module.exports = mongoose.models.AssessmentSubmission || mongoose.model('AssessmentSubmission', AssessmentSubmissionSchema);