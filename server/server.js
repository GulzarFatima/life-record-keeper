import "dotenv/config";
import path from "path";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import categoriesRoutes from "./routes/categories.routes.js";
import recordsRoutes from "./routes/records.routes.js";
import documentsRoutes from "./routes/documents.routes.js";
import { requireAuth } from "./middleware/auth.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import adminRoutes from "./routes/admin.routes.js";
import sharesRouter from "./routes/shares.routes.js";

const app = express();

// ---------- Middleware ----------
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-hosting-domain.web.app",
  "https://your-custom-domain.com",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / health checks
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, true); 
  },
  credentials: true,
}));

app.use(express.json());

// Serve uploaded files 
const uploadsDir = path.join(process.cwd(), "server", "uploads");
app.use("/uploads", express.static(uploadsDir));

// Health endpoint 
app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

// Protected routes
app.use("/api/v1/categories", requireAuth, categoriesRoutes);
app.use("/api/v1/records", requireAuth, recordsRoutes);

// Document routes (upload/download)
app.use("/api/v1/records", documentsRoutes);

// Share links
app.use("/api/v1", sharesRouter);

// Admin routes
app.use("/api/v1/admin", requireAuth, requireAdmin, adminRoutes);

app.get("/api/v1/admin/debug", requireAuth, requireAdmin, (req, res) => {
  res.json({ uid: req.user?.uid, email: req.user?.email, ok: true });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(err.status || 500).json({ error: err?.message || "Internal Server Error" });
});

// ---------- Startup ----------
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("API listening on", PORT);
});

// Connect to Mongo *after* starting the server 
const { MONGO_URI } = process.env;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("Mongo error:", err.message));
} else {
  console.warn("MONGO_URI not set; skipping MongoDB connect");
}
