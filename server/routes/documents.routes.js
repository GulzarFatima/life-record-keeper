import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import Record from "../models/Record.js";
import { requireAuth } from "../middleware/auth.js";

// --- S3 support ---
// import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v));
const useS3 = process.env.UPLOADS_DRIVER === "s3";

console.log(
  "UPLOADS_DRIVER=", process.env.UPLOADS_DRIVER,
  "AWS_REGION=", process.env.AWS_REGION,
  "S3_BUCKET=", process.env.S3_BUCKET
);

const router = Router();

// -----------------------------
// Helpers
// -----------------------------
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function safeName(name = "upload") {
  return name.replace(/[^\w.\-()+@ ]+/g, "_");
}

function s3KeyFromFile(f) {
  if (f?.key) return f.key;
  if (f?.Key) return f.Key;
  if (f?.location) {
    try {
      const u = new URL(f.location);
      return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    } catch {
      const i = String(f.location).indexOf(".amazonaws.com/");
      if (i > -1) return decodeURIComponent(f.location.slice(i + ".amazonaws.com/".length));
    }
  }
  return null;
}

// -----------------------------
// Multer storage (S3 / local)
// -----------------------------
let upload;
let s3 = null;

if (useS3) {
  // s3 = new S3Client({ region: process.env.AWS_REGION });
  // s3 = new S3Client({
  //      region: process.env.AWS_REGION,
       s3 = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });

  upload = multer({
    storage: multerS3({
      s3,
      bucket: process.env.S3_BUCKET,
      // acl: "public-read", // easy public viewing
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uid = req.user?.uid || "anon";
        const recordId = req.params.id;
        const ts = Date.now();
        cb(null, `${uid}/${recordId}/${ts}__${safeName(file.originalname)}`);
      },
    }),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
  });
} else {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const uid = req.user?.uid || "anon";
        const recordId = req.params.id;
        const dest = path.join(process.cwd(), "server", "uploads", uid, recordId);
        await ensureDir(dest);
        cb(null, dest);
      } catch (e) { cb(e); }
    },
    filename: (req, file, cb) => {
      const ts = Date.now();
      cb(null, `${ts}__${safeName(file.originalname)}`);
    },
  });

  upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
}

// -----------------------------
// Routes
// -----------------------------

// GET list of documents for a record
router.get("/:id/documents", requireAuth, async (req, res) => {
  const uid = req.user?.uid;
  const rec = await Record.findOne({ _id: req.params.id, userId: uid }).lean();
  if (!rec) return res.status(404).json({ error: "Record not found" });
  res.json(rec.documents || []);
});

// POST upload (single or multiple)
router.post
("/:id/documents", 
  requireAuth, 
  upload.array("files", 10), 
  async (req, res) => {
  const uid = req.user?.uid;
  const rec = await Record.findOne({ _id: req.params.id, userId: uid });
  if (!rec) 
    return res.status(404).json({ error: "Record not found" });

  // rename support
  let names = req.body["names[]"] ?? req.body.names ?? [];
  if (!Array.isArray(names)) names = [names];

  let docs = [];

  if (useS3) {
    docs = (req.files || []).map((f, idx) => {
      const key = s3KeyFromFile(f) || `${uid}/${rec._id}/${Date.now()}__${safeName(f.originalname)}`;
      const url =
        f.location ||
        `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        filename: key.split("/").pop(),
        originalName: f.originalname,
        displayName: (names[idx] || "").trim() || f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        url,        
        s3Key: key, 
        createdAt: new Date(),
      };
    });
  } else {
    const baseUrl = "/uploads"; 
    docs = (req.files || []).map((f, idx) => ({
      filename: f.filename,
      originalName: f.originalname,
      displayName: (names[idx] || "").trim() || f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      url: `${baseUrl}/${uid}/${rec._id}/${f.filename}`,
      createdAt: new Date(),
    }));
  }

  rec.documents.push(...docs);
  rec.documentsCount = rec.documents.length;
  await rec.save();

  res.status(201).json(docs);
});

// DELETE one document
router.delete("/:id/documents/:docId", requireAuth, async (req, res) => {
  const uid = req.user?.uid;
  const { id } = req.params;
  const raw = req.params.docId || "";
  const docId = decodeURIComponent(raw);

  const rec = await Record.findOne({ _id: id, userId: uid });
  if (!rec) return res.status(404).json({ error: "Record not found" });

  // Helper to compare safely
  const eq = (a, b) => String(a || "") === String(b || "");

  //ObjectId lookup 
  let idx = -1;
  let doc = null;
  if (isObjectId(docId)) {
    doc = rec.documents.id(docId);
    if (doc) idx = rec.documents.indexOf(doc);
  }
  // Other fields lookup
  if (idx < 0) {
    idx = rec.documents.findIndex(d => {
      const urlTail = d?.url ? String(d.url).split("/").pop() : "";
      return (
        eq(d?._id, docId) ||
        eq(d?.id, docId) ||
        eq(d?.filename, docId) ||
        eq(d?.originalName, docId) ||
        eq(urlTail, docId) ||
        eq(d?.s3Key, docId) ||
        (d?.s3Key && String(d.s3Key).endsWith("/" + docId))
      );
    });
    if (idx >= 0) doc = rec.documents[idx];
  }

  if (idx < 0 || !doc) return res.status(404).json({ error: "Document not found" });
// Delete from strograge
  try {
    if (useS3 && doc.s3Key) {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: doc.s3Key,
      }));
    } else if (doc.filename) {
      const filePath = path.join(process.cwd(), "server", "uploads", uid, id, doc.filename);
      await fs.unlink(filePath).catch(() => {});
    }
  } catch (e) {
    console.warn("Storage delete failed:", e?.message);
  }

  // Remove from array 
  if (doc._id) {
    doc.deleteOne();
  } else {
    rec.documents.splice(idx, 1);
    rec.markModified("documents");
  }

  rec.documentsCount = rec.documents.length;
  await rec.save();

  res.json({ ok: true });
});

export default router;
