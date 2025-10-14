import { Router } from "express";
import Record from "../models/Record.js";
import Category from "../models/Category.js";

const router = Router();

function normalizeDetails(catName = "", details = {}) {
  const t = (catName || details.type || "").toLowerCase();

  if (t === "education") {
    return {
      type: "education",
      program: details.program || "",
      institution: details.institution || "",
      address: details.address || "",
      phone: details.phone || "",
    };
  }

  if (t === "career") {
    return {
      type: "career",
      company: details.company || "",
      location: details.location || "",
      employmentType: details.employmentType || "",
    };
    }

  if (t === "travel") {
    return {
      type: "travel",
      purpose: details.purpose || "",
      origin: details.origin || "",
      destination: details.destination || "",
    };
  }

  return { type: t || "" };
}

/** GET /api/v1/records?category=Education | ?categoryId=... */
router.get("/", async (req, res) => {
  try {
    const uid = req.user?.uid; // set by requireAuth
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const categoryName = req.query.category || req.query.categoryName;
    const categoryId = req.query.categoryId;

    let catId = categoryId;
    if (!catId) {
      if (!categoryName) return res.status(400).json({ error: "category or categoryId required" });
      const cat = await Category.findOne({
        userId: uid,
        name: new RegExp(`^${categoryName}$`, "i"),
      }).lean();
      if (!cat) return res.json([]); // user has no records yet in that category
      catId = cat._id;
    }

    const rows = await Record.find({ userId: uid, categoryId: catId })
      .sort({ updatedAt: -1, createdAt: -1 })
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

    const {
      categoryId,
      title,
      notes = "",
      startDate = null,
      endDate = null,
      highlight = false,
      tags = [],
      details = {},
    } = req.body;

    if (!categoryId || !title?.trim()) {
      return res.status(400).json({ error: "categoryId and title are required" });
    }

    // ensure category belongs to this user
    const cat = await Category.findOne({ _id: categoryId, userId: uid }).lean();
    if (!cat) return res.status(400).json({ error: "Invalid categoryId" });

    const doc = await Record.create({
      userId: uid,
      categoryId,
      title: title.trim(),
      notes,
      startDate,
      endDate,
      highlight,
      tags,
      details: normalizeDetails(cat.name, details),
      documentsCount: 0,
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("POST /records failed:", e);
    res.status(500).json({ error: "Failed to create record" });
  }
});

/** GET /api/v1/records/:id */
router.get("/:id", async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const row = await Record.findOne({ _id: req.params.id, userId: uid }).lean();
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

/** PATCH /api/v1/records/:id */
router.patch("/:id", async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    // load record + its category to normalize details correctly
    const existing = await Record.findOne({ _id: req.params.id, userId: uid }).lean();
    if (!existing) return res.status(404).json({ error: "Not found" });

    const cat = await Category.findOne({ _id: existing.categoryId, userId: uid }).lean();

    const allowed = ["title", "notes", "startDate", "endDate", "highlight", "tags", "details"];
    const $set = {};
    for (const k of allowed) {
      if (k in req.body) $set[k] = req.body[k];
    }

    if ("details" in $set) {
      $set.details = normalizeDetails(cat?.name, $set.details || {});
    }

    const row = await Record.findOneAndUpdate(
      { _id: req.params.id, userId: uid },
      { $set },
      { new: true }
    ).lean();

    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) {
    console.error("PATCH /records/:id failed:", e);
    res.status(500).json({ error: "Failed to update record" });
  }
});

/** DELETE /api/v1/records/:id */
router.delete("/:id", async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const del = await Record.deleteOne({ _id: req.params.id, userId: uid });
  if (!del.deletedCount) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;
