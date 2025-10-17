import User from "../models/User.js"; 

export async function requireAdmin(req, res, next) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    // if requireAuth already set a role from token/claims, trust it.
    if (req.user.role === "admin") return next();

    // allow admins via ENV list
    // e.g. ADMIN_UIDS=b1eSXYIjfdhgr8eCx4vgsQ6Gubi2,anotherUid
    const envAdmins = (process.env.ADMIN_UIDS || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    if (envAdmins.includes(uid)) {
      req.user.role = "admin";
      return next();
    }

    // check Mongo
    let me = await User.findOne({ firebaseUid: uid }).lean();

    // if user doc doesn’t exist yet 
    if (!me) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (me.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    req.user.role = "admin";
    return next();
  } catch (e) {
    console.error("requireAdmin error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
