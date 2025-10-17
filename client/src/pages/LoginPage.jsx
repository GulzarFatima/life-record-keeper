import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/use-auth.js";
import "@/styles/login.css";
import "@/styles/form.css";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      nav("/categories/Education", { replace: true });
    }
  }, [user, loading, nav]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!email || !password) return setErr("Please enter your email and password.");

    try {
      setBusy(true);
      await login(email.trim(), password, remember);
    
    } catch (e) {
      console.error("login failed:", e);
      const msg =
        e?.code === "auth/invalid-credential" ? "Invalid email or password." :
        e?.code === "auth/user-disabled" ? "This account is disabled." :
        e?.message || "Login failed. Try again.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="login-wrapper">
        <div className="login-card">Loading…</div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <h2>Log in</h2>

        {err && <div className="alert" role="alert">{err}</div>}

        <div className="field">
          <label className="label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <div className="pw-row">
            <label className="label" htmlFor="login-password">Password</label>
          </div>
          <input
            id="login-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <p className="hint">Use at least 6 characters.</p>
        </div>

        <div className="field checkbox">
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Stay signed in
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy} aria-busy={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
          <Link className="btn btn-ghost" to="/signup">Create account</Link>
        </div>

        <div className="aux-links" style={{ marginTop: 8 }}>
          <Link to="/forgot" className="aux-link">Forgot password?</Link>
        </div>

        <div className="aux-links">
        <Link className="aux-link" to="/admin/login">Admin sign in</Link>
        </div>

      </form>
    </div>
  );
}
