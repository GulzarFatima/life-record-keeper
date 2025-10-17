export function requireAdmin(req, res, next) {
    const uid   = req.user?.uid || "";
    const email = (req.user?.email || "").toLowerCase();
  
    const allowUids = (process.env.ADMIN_UIDS || "")
      .split(",").map(s => s.trim()).filter(Boolean);
  
    const allowEmails = (process.env.ADMIN_EMAILS || "")
      .toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  
    const ok = (uid && allowUids.includes(uid)) || (email && allowEmails.includes(email));
  
    if (ok) return next();
  
    // print email
    console.warn("requireAdmin 403", { uid, email, allowUids, allowEmails });
    return res.status(403).json({ error: "Forbidden" });
  }
  