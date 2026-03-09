import mongoose from "mongoose";

const ElementSchema = new mongoose.Schema({
  type: { type: String, required: true },
  key: { type: String, required: true },
  value: { type: String, default: '' },
  label: { type: String, required: true },
  default: { type: String, default: '' },
  options: [{
    label: { type: String },
    value: { type: String },
    key: { type: String }
  }],
});

const AppMetaSchema = new mongoose.Schema({
  appId: { type: String, required: true, unique: true },
  metaInfo: [ElementSchema]
}, {
  timestamps: true
});

export default mongoose.model('AppMeta', AppMetaSchema)