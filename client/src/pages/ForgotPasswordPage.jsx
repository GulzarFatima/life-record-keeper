import { useState } from "react";
import { useAuth } from "@/lib/use-auth.js";
import "@/styles/login.css";
import "@/styles/form.css";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!email.trim()) { setErr("Enter your email."); return; }
    try {
      setBusy(true);
      await resetPassword(email.trim());
      setMsg("Password reset link sent. Check your email.");
    } catch (e) {
      setErr(e?.message || "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={onSubmit}>
        <h2>Reset your password</h2>
        {msg && <div className="alert" role="status">{msg}</div>}
        {err && <div className="alert" role="alert">{err}</div>}
        <div className="field">
          <label className="label" htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy} aria-busy={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </div>
      </form>
    </div>
  );
}
