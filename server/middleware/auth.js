import { admin } from "../firebaseAdmin.js";

export async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = await admin.auth().verifyIdToken(token, false);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    return next();
  } catch (e) {
    console.error("verifyIdToken failed:", e.errorInfo || e.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}
