import mongoose from "mongoose";
const CategorySchema = new mongoose.Schema(
  { userId: { type: String, index: true, required: true }, name: { type: String, required: true } },
  { timestamps: true }
);
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });
export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
