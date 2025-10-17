// server/routes/admin.routes.js
import { Router } from "express";
import { admin } from "../firebaseAdmin.js";
import Record from "../models/Record.js";
import Category from "../models/Category.js";

const router = Router();
const db = admin.firestore();

/**
 * GET /api/v1/admin/summary
 * {
 *   usersCount,
 *   recordsCount,
 *   categories: [{ name, count }]
 * }
 */
router.get("/summary", async (req, res) => {
  try {
    // count users via Firebase Auth
    let usersCount = 0;
    let nextPageToken = undefined;
    do {
      const page = await admin.auth().listUsers(1000, nextPageToken);
      usersCount += page.users.length;
      nextPageToken = page.pageToken;
    } while (nextPageToken);

    // records count from Mongo
    const recordsCount = await Record.countDocuments();

    // per-category counts with category names
    const agg = await Record.aggregate([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ["$cat.name", "Unknown"] },
          count: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({
      usersCount,
      recordsCount,
      categories: agg,
    });
  } catch (e) {
    console.error("GET /admin/summary failed:", e);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

/**
 * GET /api/v1/admin/users
 * Returns array of auth users with role & status.
 */
router.get("/users", async (req, res) => {
    try {
      const users = [];
      const uids = [];
      let nextPageToken = undefined;
  
      // 1) Get base auth users + any custom claims
      do {
        const page = await admin.auth().listUsers(1000, nextPageToken);
        page.users.forEach((u) => {
          const roleFromClaims =
            u.customClaims?.role || (u.customClaims?.admin ? "admin" : "user");
  
          users.push({
            uid: u.uid,
            email: u.email || "",
            displayName: u.displayName || "",
            disabled: !!u.disabled,
            emailVerified: !!u.emailVerified,
            role: roleFromClaims, 
            createdAt: u.metadata?.creationTime || null,
            lastLoginAt: u.metadata?.lastSignInTime || null,
          });
          uids.push(u.uid);
        });
        nextPageToken = page.pageToken;
      } while (nextPageToken);
  
      if (uids.length) {
        // 2) Firestore roles/{uid}
        const roleRefs = uids.map((id) => db.doc(`roles/${id}`));
        const roleSnaps = await db.getAll(...roleRefs);
        const rolesMap = new Map();
        roleSnaps.forEach((s) => {
          if (s.exists) rolesMap.set(s.id, s.data().role);
        });
  

      // 3) Firestore users/{uid} (active flag, name)
      const userRefs = uids.map((id) => db.doc(`users/${id}`));
      const userSnaps = await db.getAll(...userRefs);
      const activeMap = new Map();
      const nameMap = new Map();
      userSnaps.forEach((s) => {
        if (!s.exists) return;
        const data = s.data() || {};
        activeMap.set(s.id, data.active !== false); 
        if (data.name) nameMap.set(s.id, data.name);
      });

      // 4) Merge everything
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const roleFromFS = rolesMap.get(u.uid);
        users[i] = {
          ...u,
          
          role:
            (u.role === "admin" ? "admin" : (roleFromFS || u.role || "user")),
          active: activeMap.has(u.uid) ? activeMap.get(u.uid) : true,
          displayName: u.displayName || nameMap.get(u.uid) || "",
        };
      }
    }

    res.json(users);
  } catch (e) {
    console.error("GET /admin/users failed:", e);
    res.status(500).json({ error: "Failed to list users" });
  }
});

export default router;