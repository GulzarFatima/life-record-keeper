import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import Category from "../src/models/Category.js";
dotenv.config();

const { MONGO_URI } = process.env;

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected");

  const user = await User.create({
    email: "alice@example.com",
    passwordHash: "hashed-password-here",
    fullName: "Alice Ahmed",
  });

  await Category.insertMany([
    { userId: user._id, name: "Education", isDefault: true },
    { userId: user._id, name: "Travel",    isDefault: true },
    { userId: user._id, name: "Career",    isDefault: true },
  ]);

  console.log("Seeded user + categories:", user._id.toString());
  await mongoose.disconnect();
  console.log("Done");
}
main().catch(e => { console.error(e); process.exit(1); });
