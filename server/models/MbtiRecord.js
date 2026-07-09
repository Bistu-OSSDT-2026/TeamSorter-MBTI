import mongoose from "mongoose";

const MbtiRecordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mbtiType: { type: String, required: true },
  ei: { type: String, enum: ['E', 'I'], required: true },
  traits: {
    energy: { type: Number, default: 0 },
    information: { type: Number, default: 0 },
    decision: { type: Number, default: 0 },
    lifestyle: { type: Number, default: 0 }
  },
  tags: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('MbtiRecord', MbtiRecordSchema);
