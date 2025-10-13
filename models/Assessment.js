const mongoose = require('mongoose');
const { AssessmentTypeValues } = require('../constants/assessmentTypes');

const AttachmentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  mimetype: String
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'multiple_choice', 'essay', 'file_upload'],
    default: 'text'
  },
  question: { type: String, required: true },
  options: [String],
  correctAnswer: String,
  points: { type: Number, default: 1 },
  required: { type: Boolean, default: true }
}, { _id: false });

const AssessmentSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  assessmentType: { type: String, enum: AssessmentTypeValues, required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lecturerName: { type: String },
  startTime: { type: Date },
  endTime: { type: Date },
  restrictToAttendees: { type: Boolean, default: false },
  questions: [QuestionSchema],
  attachments: [AttachmentSchema],
  isPublished: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

AssessmentSchema.index({ lecturer: 1, createdAt: -1 });
AssessmentSchema.index({ courseCode: 1, assessmentType: 1 });

module.exports = mongoose.models.Assessment || mongoose.model('Assessment', AssessmentSchema);