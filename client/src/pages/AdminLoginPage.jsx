import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/use-auth.js";
import "@/styles/login.css";
import "@/styles/form.css";

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!email || !password) return setErr("Enter email and password.");
    try {
      setLoading(true);
      await adminLogin(email.trim(), password);
      nav("/admin", { replace: true });
    } catch (e) {
      setErr(e?.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <h2>Admin sign in</h2>

        {err && <div className="alert" role="alert">{err}</div>}

        <div className="field">
          <label className="label" htmlFor="admin-email">Email</label>
          <input id="admin-email" className="input" type="email" autoComplete="email"
                 value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>

        <div className="field">
          <div className="pw-row">
            <label className="label" htmlFor="admin-password">Password</label>
            <button type="button" className="btn-link"
                    onClick={()=>setShowPw(s=>!s)} aria-pressed={showPw}
                    aria-controls="admin-password">
              {showPw ? "Hide" : "Show"} <span className="sr-only">password</span>
            </button>
          </div>
          <input id="admin-password" className="input"
                 type={showPw ? "text" : "password"}
                 autoComplete="current-password"
                 value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <Link className="btn btn-ghost" to="/login">User sign in</Link>
        </div>
      </form>
    </div>
  );
}
