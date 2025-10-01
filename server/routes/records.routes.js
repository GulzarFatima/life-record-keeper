// server/routes/records.routes.js
import { Router } from "express";
import Record from "../models/Record.js";
import Category from "../models/Category.js";

const router = Router();

/** GET /api/v1/records?category=Education */
router.get("/", async (req, res) => {
  try {
    const uid = req.user?.uid; // set by requireAuth
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const categoryName = req.query.category || req.query.categoryName;
    const categoryId = req.query.categoryId;

    let catId = categoryId;
    if (!catId) {
      if (!categoryName) return res.status(400).json({ error: "category or categoryId required" });
      const cat = await Category.findOne({ userId: uid, name: new RegExp(`^${categoryName}$`, "i") }).lean();
      if (!cat) return res.json([]); // user has no records yet in that category
      catId = cat._id;
    }

    const rows = await Record.find({ userId: uid, categoryId: catId })
      .sort({ startDate: -1, createdAt: -1 })
      .lean();

    res.json(rows);
  } catch (e) {
    console.error("GET /records failed:", e);
    res.status(500).json({ error: "Failed to load records" });
  }
});

/** POST /api/v1/records */
router.post("/", async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const { categoryId, title, notes = "", startDate = null, endDate = null, highlight = false, tags = [], details = {} } = req.body;
    if (!categoryId || !title?.trim()) return res.status(400).json({ error: "categoryId and title are required" });

    // Ensure category belongs to this user
    const cat = await Category.findOne({ _id: categoryId, userId: uid }).lean();
    if (!cat) return res.status(400).json({ error: "Invalid categoryId" });

    const doc = await Record.create({
      userId: uid,             // from auth
      categoryId,
      title: title.trim(),
      notes,
      startDate,
      endDate,
      highlight,
      tags,
      details,
      documentsCount: 0,
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("POST /records failed:", e);
    res.status(500).json({ error: "Failed to create record" });
  }
});

export default router;
