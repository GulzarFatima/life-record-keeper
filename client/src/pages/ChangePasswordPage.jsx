import { useState } from "react";
import { useAuth } from "@/lib/use-auth.js";
import "@/styles/login.css";
import "@/styles/form.css";

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    if (newPw.length < 6) { setErr("New password must be at least 6 characters."); return; }
    try {
      setBusy(true);
      await changePassword(newPw, currentPw || undefined);
      setMsg("Password updated.");
      setCurrentPw(""); setNewPw("");
    } catch (e) {
      setErr(e?.message || "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={onSubmit}>
        <h2>Change password</h2>
        {msg && <div className="alert" role="status">{msg}</div>}
        {err && <div className="alert" role="alert">{err}</div>}

        <div className="field">
          <label className="label" htmlFor="current">Current password (if asked)</label>
          <input id="current" className="input" type="password" value={currentPw} onChange={(e)=>setCurrentPw(e.target.value)} />
        </div>

        <div className="field">
          <label className="label" htmlFor="new">New password</label>
          <input id="new" className="input" type="password" value={newPw} onChange={(e)=>setNewPw(e.target.value)} minLength={6} required />
          <p className="hint">At least 6 characters.</p>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy} aria-busy={busy}>
            {busy ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
