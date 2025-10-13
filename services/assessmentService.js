const Assessment = require('../models/Assessment');
const AssessmentSubmission = require('../models/AssessmentSubmission');
const Course = require('../models/Course');
const User = require('../models/User');
const { AssessmentTypes, AssessmentTypeLabels } = require('../constants/assessmentTypes');

function resolveAssessmentStatus(assessment) {
  const now = new Date();
  if (assessment.isArchived) return 'archived';
  if (assessment.startTime && assessment.startTime > now) return 'scheduled';
  if (assessment.endTime && assessment.endTime < now) return 'ended';
  return 'active';
}

async function createAssessment({ body, files, lecturer }) {
  const {
    courseCode,
    title,
    description,
    startTime,
    endTime,
    assessmentType,
    questions,
    restrictToAttendees
  } = body;

  const attachments = (files || []).map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype
  }));

  let parsedQuestions = [];
  if (questions) {
    parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
  }

  const assessment = await Assessment.create({
    courseCode,
    title,
    description,
    assessmentType,
    lecturer: lecturer._id,
    lecturerName: lecturer.name,
    startTime: startTime ? new Date(startTime) : undefined,
    endTime: endTime ? new Date(endTime) : undefined,
    restrictToAttendees: restrictToAttendees === true || restrictToAttendees === 'true',
    questions: parsedQuestions,
    attachments
  });

  return assessment;
}

async function listLecturerAssessments({ courseCode, lecturerId }) {
  const query = {};
  if (courseCode) query.courseCode = courseCode;
  if (lecturerId) query.lecturer = lecturerId;

  const assessments = await Assessment.find(query).sort({ createdAt: -1 }).lean();
  return assessments.map((assessment) => ({
    id: assessment._id,
    courseCode: assessment.courseCode,
    title: assessment.title,
    description: assessment.description,
    assessmentType: assessment.assessmentType,
    assessmentTypeLabel: AssessmentTypeLabels[assessment.assessmentType] || assessment.assessmentType,
    restrictToAttendees: assessment.restrictToAttendees,
    status: resolveAssessmentStatus(assessment),
    startTime: assessment.startTime,
    endTime: assessment.endTime,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
    attachments: assessment.attachments,
    questionCount: Array.isArray(assessment.questions) ? assessment.questions.length : 0
  }));
}

async function listStudentAssessments({ student, courseCode }) {
  const enrolledCourseCodes = Array.isArray(student?.courses)
    ? student.courses
    : student?.course
      ? [student.course]
      : [];

  const targetCourseCodes = courseCode ? [courseCode] : enrolledCourseCodes;
  if (!targetCourseCodes.length) {
    return [];
  }

  const query = {
    courseCode: { $in: targetCourseCodes },
    isArchived: { $ne: true },
    $or: [{ isPublished: { $exists: false } }, { isPublished: true }]
  };

  const assessments = await Assessment.find(query).sort({ startTime: 1 }).lean();
  if (!assessments.length) {
    return [];
  }

  const submissions = await AssessmentSubmission.find({
    student: student._id,
    assessment: { $in: assessments.map((a) => a._id) }
  }).lean();
  const submissionMap = new Map(submissions.map((sub) => [String(sub.assessment), sub]));

  return assessments.map((assessment) => {
    const submission = submissionMap.get(String(assessment._id));
    return {
      id: assessment._id,
      courseCode: assessment.courseCode,
      title: assessment.title,
      description: assessment.description,
      assessmentType: assessment.assessmentType,
      assessmentTypeLabel: AssessmentTypeLabels[assessment.assessmentType] || assessment.assessmentType,
      restrictToAttendees: assessment.restrictToAttendees,
      status: resolveAssessmentStatus(assessment),
      startTime: assessment.startTime,
      endTime: assessment.endTime,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      submission: submission
        ? {
            status: submission.status,
            submittedAt: submission.submittedAt,
            score: submission.score,
            grade: submission.grade,
            feedback: submission.feedback
          }
        : null
    };
  });
}

async function listSubmissions({ assessmentId }) {
  const assessment = await Assessment.findById(assessmentId).lean();
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.status = 404;
    throw error;
  }

  const submissions = await AssessmentSubmission.find({ assessment: assessment._id })
    .populate({ path: 'student', select: 'studentId name email' })
    .lean();

  return {
    assessment: {
      id: assessment._id,
      title: assessment.title,
      assessmentType: assessment.assessmentType,
      assessmentTypeLabel: AssessmentTypeLabels[assessment.assessmentType] || assessment.assessmentType,
      courseCode: assessment.courseCode
    },
    submissions: submissions.map((submission) => ({
      id: submission._id,
      studentId: submission.studentId,
      studentName: submission.studentName,
      status: submission.status,
      answers: submission.answers,
      submissionText: submission.submissionText,
      submissionFiles: submission.submissionFiles,
      submittedAt: submission.submittedAt,
      score: submission.score,
      grade: submission.grade,
      feedback: submission.feedback,
      gradedAt: submission.gradedAt,
      gradedBy: submission.gradedBy,
      gradedByName: submission.gradedByName
    }))
  };
}

async function getLecturerCourses({ lecturerId }) {
  const lecturer = await User.findById(lecturerId).lean();
  if (!lecturer) return [];

  const courseCodes = lecturer?.courses || [];
  if (!courseCodes.length) return [];

  const courses = await Course.find({ code: { $in: courseCodes } })
    .select('code name')
    .lean();
  return courses.map((course) => ({ code: course.code, name: course.name }));
}

module.exports = {
  AssessmentTypes,
  createAssessment,
  listLecturerAssessments,
  listStudentAssessments,
  listSubmissions,
  getLecturerCourses
};