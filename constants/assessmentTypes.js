// constants/assessmentTypes.js
// Centralized assessment type constants to keep backend and frontend aligned

const AssessmentTypes = Object.freeze({
  CLASS: 'class',
  MID_SEMESTER: 'mid_semester',
  END_SEMESTER: 'end_semester'
});

const AssessmentTypeLabels = Object.freeze({
  [AssessmentTypes.CLASS]: 'Class Assessment',
  [AssessmentTypes.MID_SEMESTER]: 'Mid Semester',
  [AssessmentTypes.END_SEMESTER]: 'End of Semester'
});

module.exports = {
  AssessmentTypes,
  AssessmentTypeLabels,
  AssessmentTypeValues: Object.values(AssessmentTypes)
};