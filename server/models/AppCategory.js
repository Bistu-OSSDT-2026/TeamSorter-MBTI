import mongoose from "mongoose";

const AppCategorySchema = new mongoose.Schema({
  categoryname: { type: String, required: true, unique: true },
  categorynumber: { type: String, required: true, unique: true },
}, {
  timestamps: true
});

export default mongoose.model('AppCategory', AppCategorySchema)