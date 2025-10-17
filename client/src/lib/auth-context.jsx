/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc  } from "firebase/firestore";
import { getIdTokenResult } from "firebase/auth";


export const AuthCtx = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { uid, email, role, name, emailVerified }
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }
  
        // Force a fresh token so new claims are included immediately
        await firebaseUser.getIdToken(true);
        const tokenResult = await getIdTokenResult(firebaseUser);
  
        // 1) Prefer custom claim
        let role =
          tokenResult?.claims?.role ||
          (tokenResult?.claims?.admin ? "admin" : "");
  
        // 2) Fallback to Firestore
        if (!role) {
          try {
            const roleSnap = await getDoc(doc(db, "roles", firebaseUser.uid));
            role = roleSnap.exists() ? roleSnap.data().role : "user";
          } catch {
            role = "user";
          }
        }
  
        // 3) Check active flag (Firestore)
        let active = true;
        try {
          const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          active = userSnap.exists() ? userSnap.data().active !== false : true;
        } catch {
          active = true;
        }
  
        if (!active) {
          await signOut(auth);
          setUser(null);
          return;
        }
  
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role || "user",
          name: firebaseUser.displayName || "",
          emailVerified: firebaseUser.emailVerified,
        });
      } catch (err) {
        console.warn("Non-blocking role/active fetch failed:", err);
       
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "user",
            name: firebaseUser.displayName || "",
            emailVerified: firebaseUser.emailVerified,
          });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });
  
    return () => unsub();
  }, []);
  
  
  

  async function login(email, password, remember = true) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await sendEmailVerification(cred.user);
    await setDoc(doc(db, "roles", cred.user.uid), { role: "user" }, { merge: true });
    await setDoc(doc(db, "users", cred.user.uid), { name, email, createdAt: serverTimestamp() }, { merge: true });
    return cred;
  }

  async function resendVerification() {
    if (!auth.currentUser) throw new Error("Not signed in");
    await sendEmailVerification(auth.currentUser);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function reauthenticate(currentPassword) {
    if (!auth.currentUser?.email) throw new Error("No user");
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, cred);
  }

  async function changePassword(newPassword, currentPassword) {
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (e) {
      if (e.code === "auth/requires-recent-login" && currentPassword) {
        await reauthenticate(currentPassword);
        await updatePassword(auth.currentUser, newPassword);
      } else {
        throw e;
      }
    }
  }

  async function adminLogin(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "roles", cred.user.uid));
    if (!snap.exists() || snap.data().role !== "admin") {
      await signOut(auth);
      throw new Error("Not authorized as admin");
    }
    return cred;
  }

  async function reloadUser() {
    if (!auth.currentUser) return null;
    await auth.currentUser.reload();
    const f = auth.currentUser;
    const roleSnap = await getDoc(doc(db, "roles", f.uid));
    const role = roleSnap.exists() ? roleSnap.data().role : "user";
    const fresh = {
      uid: f.uid,
      email: f.email,
      role,
      name: f.displayName || "",
      emailVerified: f.emailVerified,
    };
    setUser(fresh);
    return fresh;
  }

  async function deactivateAccount() {
      if (!auth.currentUser) throw new Error("No user");
      await setDoc(doc(db, "users", auth.currentUser.uid), { active: false, deactivatedAt: serverTimestamp() }, { merge: true });
      await signOut(auth);
    }
    
    async function deleteAccount(currentPassword) {
      if (!auth.currentUser) throw new Error("No user");
      const uid = auth.currentUser.uid;
      try {
        await deleteDoc(doc(db, "users", uid));
        await deleteDoc(doc(db, "roles", uid));
        await deleteUser(auth.currentUser);
      } catch (e) {
        if (e.code === "auth/requires-recent-login" && currentPassword) {
          await reauthenticate(currentPassword);
          await deleteDoc(doc(db, "users", uid));
          await deleteDoc(doc(db, "roles", uid));
          await deleteUser(auth.currentUser);
        } else {
          throw e;
       }
      }
    }

  function logout() {
    return signOut(auth);
  }

  return (
    <AuthCtx.Provider
      value={{
        user, loading,
        login, signup, adminLogin, logout,
        resendVerification, reloadUser, resetPassword,
        changePassword, reauthenticate,deactivateAccount, deleteAccount,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
