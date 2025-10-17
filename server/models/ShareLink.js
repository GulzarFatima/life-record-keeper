import mongoose from "mongoose";

const ShareLinkSchema = new mongoose.Schema({
  userId: { type: String, index: true, required: true }, 
  scope: {
    type: { type: String, enum: ["category"], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  },
  includeDocs: { type: Boolean, default: false },
  token: { type: String, unique: true, index: true, required: true },
  expiresAt: { type: Date, index: true, required: true },
  revokedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ShareLink", ShareLinkSchema);
