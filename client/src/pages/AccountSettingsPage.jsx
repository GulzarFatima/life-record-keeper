import { useState } from "react";
import { useAuth } from "@/lib/use-auth.js";
import "@/styles/login.css";
import "@/styles/form.css";

export default function AccountSettingsPage() {
  const { user, resetPassword, changePassword, deactivateAccount, deleteAccount } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendReset() {
    try { setBusy(true); setMsg(""); setErr("");
      await resetPassword(user.email);
      setMsg("Reset link sent to your email.");
    } catch (e) { setErr(e.message || "Failed to send reset email."); }
    finally { setBusy(false); }
  }

  async function doChangePw(e) {
    e.preventDefault();
    try { setBusy(true); setMsg(""); setErr("");
      if (newPw.length < 6) throw new Error("Password must be at least 6 chars.");
      await changePassword(newPw, currentPw || undefined);
      setMsg("Password updated.");
      setCurrentPw(""); setNewPw("");
    } catch (e) { setErr(e.message || "Failed to change password."); }
    finally { setBusy(false); }
  }

  async function doDeactivate() {
    if (!confirm("Deactivate your account? You can contact support to reactivate.")) return;
    try { setBusy(true); await deactivateAccount(); } finally { setBusy(false); }
  }

  async function doDelete() {
    const cpw = prompt("Type your current password to confirm account deletion. This cannot be undone.");
    if (cpw === null) return;
    try { setBusy(true); await deleteAccount(cpw); }
    catch (e) { alert(e.message || "Delete failed. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Account settings</h2>
        {msg && <div className="alert" role="status">{msg}</div>}
        {err && <div className="alert" role="alert">{err}</div>}

        <div className="hr" style={{margin:"12px 0"}}></div>

        <div className="field">
          <label className="label">Reset password by email</label>
          <button className="btn" onClick={sendReset} disabled={busy}>Send reset link</button>
        </div>

        <form onSubmit={doChangePw}>
          <div className="field">
            <label className="label" htmlFor="cur">Current password (only if asked)</label>
            <input id="cur" className="input" type="password" value={currentPw} onChange={e=>setCurrentPw(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="new">New password</label>
            <input id="new" className="input" type="password" minLength={6} required value={newPw} onChange={e=>setNewPw(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>Change password</button>
          </div>
        </form>

        <div className="hr" style={{margin:"12px 0"}}></div>

        <div className="field">
          <label className="label">Deactivate account</label>
          <button className="btn" onClick={doDeactivate} disabled={busy}>Deactivate</button>
        </div>

        <div className="field">
          <label className="label">Delete account (permanent)</label>
          <button className="btn btn-secondary" onClick={doDelete} disabled={busy}>Delete permanently</button>
        </div>
      </div>
    </div>
  );
}
