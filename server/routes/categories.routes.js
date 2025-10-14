import { Router } from "express";
import Category from "../models/Category.js";

const router = Router();

// GET /api/v1/categories -> [{ _id, name }]
router.get("/", async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    let cats = await Category.find({ userId: uid }).sort({ name: 1 }).lean();

    if (!cats.length) {
      const defaults = ["Education", "Career", "Travel"];
      await Category.insertMany(defaults.map((name) => ({ userId: uid, name })));
      cats = await Category.find({ userId: uid }).sort({ name: 1 }).lean();
    }

    res.json(cats.map(({ _id, name }) => ({ _id, name })));
  } catch (e) {
    console.error("GET /categories failed:", e);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

export default router;
