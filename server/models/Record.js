
import mongoose from "mongoose";


//Document Schema
const DocumentSchema = new mongoose.Schema({
    filename: String, //stored name on disk 
    originalname: String, //original file name
    displayName: String, //rename
    mimetype: String,
    size: Number,
    url: String, //URL to access the document
    createdAt: { type: Date, default: Date.now },
}, { _id: false });


//Record Schema
const RecordSchema = new mongoose.Schema({
    userId: { type: String, index: true, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    title: { type: String, required: true },
    notes: String,
    startDate: Date,
    endDate: Date,
    highlight: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  
    documents: { type: [DocumentSchema], default: [] },
    documentsCount: { type: Number, default: 0 },
  }, { timestamps: true });
  
  export default mongoose.models.Record || mongoose.model("Record", RecordSchema);