// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "user" },
  profile: { type: Object, default: {} },
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;