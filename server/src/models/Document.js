import mongoose from "mongoose";
const documentSchema = new mongoose.Schema({

  recordId: { type: mongoose.Types.ObjectId, ref: "Record", required: true },
  uploadedBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  originalFilename: { type: String, required: true },
  storageKey: { type: String, required: true },

  mimeType: String,
  bytes: Number

}, 

{ timestamps: { createdAt: "uploadedAt", updatedAt: false }});

documentSchema.index({ recordId: 1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
