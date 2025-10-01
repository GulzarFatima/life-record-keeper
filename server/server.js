import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import categoriesRoutes from "./routes/categories.routes.js";
import recordsRoutes from "./routes/records.routes.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/v1/health", (req, res) => res.json({ ok: true }));


app.use("/api/v1/categories", requireAuth, categoriesRoutes);
app.use("/api/v1/records", requireAuth, recordsRoutes);

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
