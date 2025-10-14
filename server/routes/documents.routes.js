import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import Record from "../models/Record.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uid = req.user?.uid;
      const recordId = req.params.id;
      const dest = path.join(process.cwd(), "server", "uploads", uid, recordId);
      await ensureDir(dest);
      cb(null, dest);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.\-()+@ ]+/g, "_");
    cb(null, `${ts}__${safe}`);
  },
});

const upload = multer({ storage });

// GET /:id/documents
router.get("/:id/documents", requireAuth, async (req, res) => {
  const uid = req.user?.uid;
  const rec = await Record.findOne({ _id: req.params.id, userId: uid }).lean();
  if (!rec) return res.status(404).json({ error: "Record not found" });
  res.json(rec.documents || []);
});

// POST /:id/documents
router.post("/:id/documents", requireAuth, upload.array("files", 10), async (req, res) => {
  const uid = req.user?.uid;
  const rec = await Record.findOne({ _id: req.params.id, userId: uid });
  if (!rec) return res.status(404).json({ error: "Record not found" });

  let names =
    req.body["displayNames[]"] ??
    req.body.displayNames ??
    req.body["names[]"] ??
    req.body.names ??
    req.body.displayName ??
    req.body.name ??
    [];
  if (!Array.isArray(names)) names = [names];

  const baseUrl = "/uploads";
  const docs = (req.files || []).map((f, i) => ({
    filename: f.filename,
    originalName: f.originalname,
    displayName: names[i] ? String(names[i]).trim() : f.originalname,
    mimeType: f.mimetype,
    size: f.size,
    url: `${baseUrl}/${uid}/${rec._id}/${f.filename}`,
    createdAt: new Date(),
  }));

  rec.documents.push(...docs);
  rec.documentsCount = rec.documents.length;
  await rec.save();

  res.status(201).json(docs);
});

// DELETE /:id/documents/:docId
// DELETE one document
router.delete("/:id/documents/:docId", requireAuth, async (req, res) => {
    const uid = req.user?.uid;
    const { id, docId } = req.params;
  
    const rec = await Record.findOne({ _id: id, userId: uid });
    if (!rec) return res.status(404).json({ error: "Record not found" });
  
    // 1) Try subdoc by _id
    let doc = rec.documents.id(docId);
  
    // 2) Fallback - match by filename or url tail if no subdoc id match
    if (!doc) {
      const idx = rec.documents.findIndex(
        d => d.filename === docId ||
             (d.url && d.url.endsWith(`/${docId}`))
      );
      if (idx >= 0) doc = rec.documents[idx];
    }
  
    if (!doc) return res.status(404).json({ error: "Document not found" });
  
    // remove file from disk 
    try {
      const filePath = path.join(process.cwd(), "server", "uploads", uid, id, doc.filename);
      await fs.unlink(filePath);
    } catch { /* ignore */ }
  
    // remove from array
    if (doc.remove) {
      // subdocument path
      doc.remove();
    } else {
      // index path 
      rec.documents = rec.documents.filter(d =>
        !(d.filename === doc.filename && (d._id?.toString?.() === doc._id?.toString?.()))
      );
    }
  
    rec.documentsCount = rec.documents.length;
    await rec.save();
  
    res.json({ ok: true });
  });
  
  

export default router;
