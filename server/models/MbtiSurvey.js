import mongoose from "mongoose";

const MbtiSurveySchema = new mongoose.Schema({
  source: { type: String, default: '' },
  submitTime: { type: String },
  fillId: { type: String },
  duration: { type: String },
  phone: { type: String },
  name: { type: String, required: true },
  studentId: { type: String },
  college: { type: String },
  major: { type: String },
  mbtiType: { type: String },
  scores: {
    communication: { type: Number, default: 0 },
    collaboration: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    projectManagement: { type: Number, default: 0 },
    learningAdaptability: { type: Number, default: 0 },
    responsibility: { type: Number, default: 0 },
    teamwork: { type: Number, default: 0 },
    challenge: { type: Number, default: 0 }
  },
  preferences: {
    activity: { type: String },
    activityType: { type: String },
    hobby: { type: String }
  },
  raw: { type: Object }
}, { timestamps: true });

export default mongoose.model('MbtiSurvey', MbtiSurveySchema);
