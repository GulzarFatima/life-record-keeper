import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch {
    admin.initializeApp();
  }
}

export { admin };
export default admin;
