import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, index: true },
    email:       { type: String, index: true },
    name:        { type: String, default: "" },
    role:        { type: String, enum: ["user", "admin"], default: "user", index: true },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
