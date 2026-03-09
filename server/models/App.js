import mongoose from "mongoose";

const AppSchema = new mongoose.Schema({
  _id: { type: String }, // 💡 允许使用字符串作为 ID (如 "default_assistant")
  appname: { type: String, required: true, unique: true },
  appkeywords: { type: String, required: true },
  systemMessage: { type: String, required: true },
  category: { type: String, required: true, default: "uncategory" },
  aicategory: { type: String, required: true, default: "unai" },
  bot_id: { type: String, default: "" }
}, {
  timestamps: true
});

export default mongoose.model('App', AppSchema)