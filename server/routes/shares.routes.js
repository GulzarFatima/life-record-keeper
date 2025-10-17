import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import crypto from "crypto";
import ShareLink from "../models/ShareLink.js";
import Record from "../models/Record.js";
import Category from "../models/Category.js";

const router = Router();

function newToken() {
  return crypto.randomBytes(24).toString("base64url");
}
function isActive(link) {
  return link && !link.revokedAt && link.expiresAt > new Date();
}

/** POST /shares/category  -> create category share link
 *  body: { categoryName?: string, categoryId?: string, includeDocs?: boolean, ttlHours?: number }
 */
router.post("/shares/category", requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const { categoryName, categoryId, includeDocs = false, ttlHours = 72 } = req.body || {};
    let cat = null;

    if (categoryId) {
      cat = await Category.findOne({ _id: categoryId, userId: uid }).lean();
    } else if (categoryName) {
      cat = await Category.findOne({
        userId: uid,
        name: new RegExp(`^${categoryName}$`, "i"),
      }).lean();
    }

    if (!cat) return res.status(400).json({ error: "Invalid category" });

    const token = newToken();
    const expiresAt = new Date(Date.now() + Number(ttlHours) * 3600 * 1000);

    const link = await ShareLink.create({
      userId: uid,
      scope: { type: "category", categoryId: cat._id },
      includeDocs: !!includeDocs,
      token,
      expiresAt,
    });

    // Your app origin (frontend route will read this)
    const origin = process.env.APP_ORIGIN || "http://localhost:5173";
    const url = `${origin}/share/${token}`;

    res.status(201).json({ url, expiresAt: link.expiresAt, includeDocs: link.includeDocs });
  } catch (e) {
    console.error("POST /shares/category failed:", e);
    res.status(500).json({ error: "Failed to create share link" });
  }
});

/** GET /public/shares/:token  -> public viewer payload */
router.get("/public/shares/:token", requireAuth, async (req, res) => {
  try {
    const link = await ShareLink.findOne({ token: req.params.token }).lean();
    if (!isActive(link)) return res.status(410).json({ error: "Link expired or revoked" });

    if (link.scope?.type !== "category") {
      return res.status(400).json({ error: "Unsupported share scope" });
    }

    const category = await Category.findById(link.scope.categoryId).lean();
    if (!category) return res.status(404).json({ error: "Not found" });

    // Fetch records in that category, owned by the sharer
    const records = await Record.find({
      userId: link.userId,
      categoryId: category._id,
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    // Minimize payload & optionally strip docs
    const items = records.map(({ userId, ...r }) => {
      const safe = { ...r };
      if (!link.includeDocs) {
        delete safe.documents;      
        delete safe.documentsCount; 
      }
      return safe;
    });

    res.json({
      type: "category",
      category: { name: category.name, _id: category._id },
      includeDocs: !!link.includeDocs,
      expiresAt: link.expiresAt,
      items,
    });
  } catch (e) {
    console.error("GET /public/shares/:token failed:", e);
    res.status(500).json({ error: "Failed to load share" });
  }
});

/** POST /shares/:token/revoke */
router.post("/shares/:token/revoke", async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    const link = await ShareLink.findOne({ token: req.params.token, userId: uid });
    if (!link) return res.status(404).json({ error: "Not found" });
    link.revokedAt = new Date();
    await link.save();
    res.json({ ok: true });
  } catch (e) {
    console.error("POST /shares/:token/revoke failed:", e);
    res.status(500).json({ error: "Failed to revoke link" });
  }
});

export default router;
