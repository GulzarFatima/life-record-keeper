import mongoose from "mongoose";
const RecordSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    title: { type: String, required: true },
    notes: String,
    startDate: Date,
    endDate: Date,
    highlight: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    documentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export default mongoose.models.Record || mongoose.model("Record", RecordSchema);
