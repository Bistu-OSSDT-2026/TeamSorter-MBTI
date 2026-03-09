import mongoose from "mongoose";

const AppDialoguesSchema = new mongoose.Schema({
  appId: { type: String, required: true },
  userId: { type: String, required: true },
  chats: [
    {
      senderType: { type: String, required: true }, // 'user' 或 'assistant'
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

// 创建一个复合索引，确保 appId 和 userId 的组合是唯一的
AppDialoguesSchema.index({ appId: 1, userId: 1 }, { unique: true });

export default mongoose.model('AppDialogues', AppDialoguesSchema)