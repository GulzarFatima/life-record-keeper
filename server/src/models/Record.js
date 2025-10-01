import mongoose from "mongoose";

const detailsSchema = new mongoose.Schema({
  type: { type: String, enum: ["education","travel","career","custom"], required: true },

  // education
  degreeName: String, programName: String, institutionName: String,
  institutionAddress: String, institutionPhone: String,

  // travel
  tripName: String, fromLocation: String, toLocation: String,
  purpose: String, entryDate: Date, exitDate: Date,

  // career
  employerName: String, jobTitle: String, employerAddress: String,
  employerPhone: String, startDateCareer: Date, endDateCareer: Date,
  isCurrent: { type: Boolean, default: false }
}, 
{ _id: false });

const recordSchema = new mongoose.Schema({

  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: mongoose.Types.ObjectId, ref: "Category", required: true },
  title: { type: String, required: true },

  notes: String,
  startDate: Date,
  endDate: Date,

  documentsCount: { type: Number, default: 0, min: 0 },
  details: detailsSchema
}, 
{ timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }});

recordSchema.index({ userId: 1, categoryId: 1, updatedAt: -1 });

const Record = mongoose.model("Record", recordSchema);

export default Record;
