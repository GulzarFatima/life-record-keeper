import mongoose from "mongoose";
const categorySchema = new mongoose.Schema({
    
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, 

{ timestamps: { createdAt: "createdAt", updatedAt: false }});

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

export default Category; 
