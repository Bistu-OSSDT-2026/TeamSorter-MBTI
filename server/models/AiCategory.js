import mongoose from "mongoose";

const AiCategorySchema = new mongoose.Schema({
  AiName: { type: String, required: true, unique: true },
  AiUrl: { type: String, required: true, unique: true },
  AiToken: { type: String, required: true, unique: true },
  IsNeedBotId: { type: Boolean, required: true, unique: true },
}, {
  timestamps: true
});

export default mongoose.model('AiCategory', AiCategorySchema)