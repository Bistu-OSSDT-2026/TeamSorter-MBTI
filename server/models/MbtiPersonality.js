import mongoose from "mongoose";

const MbtiPersonalitySchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  ei: { type: String, enum: ['E', 'I'], required: true },
  sn: { type: String, enum: ['S', 'N'], required: true },
  tf: { type: String, enum: ['T', 'F'], required: true },
  jp: { type: String, enum: ['J', 'P'], required: true },
  strengths: [{ type: String }],
  advice: { type: String },
  dimensions: {
    energy: { type: Number, default: 0 },
    information: { type: Number, default: 0 },
    decision: { type: Number, default: 0 },
    lifestyle: { type: Number, default: 0 }
  },
  keywords: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('MbtiPersonality', MbtiPersonalitySchema);
