import "../firebaseAdmin.js";
import { getAuth } from "firebase-admin/auth";

const uid = process.argv[2];
if (!uid) {
  console.error("Usage: node server/scripts/setAdmin.js <uid>");
  process.exit(1);
}

const auth = getAuth();
await auth.setCustomUserClaims(uid, { admin: true });
console.log(`Set admin=true for uid: ${uid}`);
process.exit(0);
