import { admin } from "../firebaseAdmin.js"; 

export async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const m = hdr.match(/^Bearer (.+)$/i);
    if (!m) return res.status(401).json({ error: "Missing token" });

    const decoded = await admin.auth().verifyIdToken(m[1], true);

    // pull basic identity
    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",

      role: decoded.role || (decoded.admin ? "admin" : "user"),
    };

    next();
  } catch (e) {
    console.error("requireAuth error:", e);
    res.status(401).json({ error: "Unauthorized" });
  }
}


export function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ error: "Forbidden" });
}
