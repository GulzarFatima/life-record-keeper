import path from "path";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import categoriesRoutes from "./routes/categories.routes.js";
import recordsRoutes from "./routes/records.routes.js";
import { requireAuth } from "./middleware/auth.js";
import documentsRoutes from "./routes/documents.routes.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());


// serve uploaded files
const uploadsDir = path.join(process.cwd(), "server", "uploads");
app.use("/uploads", express.static(uploadsDir));


app.get("/api/v1/health", (req, res) => res.json({ ok: true }));


// Protected routes
app.use("/api/v1/categories", requireAuth, categoriesRoutes);
app.use("/api/v1/records", requireAuth, recordsRoutes);



// Uploads under records path
app.use("/api/v1/records", documentsRoutes);

const { MONGO_URI, PORT = 3000 } = process.env;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API running: http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("Mongo error:", err.message);
    process.exit(1);
  });
