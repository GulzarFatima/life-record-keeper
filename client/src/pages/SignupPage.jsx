import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/use-auth.js";

import "@/styles/login.css";
import "@/styles/form.css";

export default function SignupPage() {
  const { signup } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!name.trim() || !email.trim() || !password) {
      setErr("Please enter your name, email, and password.");
      return;
    }

    try {
      setLoading(true);
      await signup(email.trim(), password, name.trim());
      nav("/categories/Education");
      //verification
      await signup(email.trim(), password, name.trim());
        nav("/verify");
    } catch (e) {
      setErr(e?.message || "Sign up failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <h2>Create your account</h2>

        {err && (
          <div className="alert" role="alert" aria-live="polite">
            {err}
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            className="input"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
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

        <div className="field">
          <div className="pw-row">
            <label className="label" htmlFor="signup-password">Password</label>
            <button
              type="button"
              className="btn-link"
              onClick={() => setShowPw((s) => !s)}
              aria-pressed={showPw}
              aria-controls="signup-password"
            >
              {showPw ? "Hide" : "Show"}
              <span className="sr-only"> password</span>
            </button>
          </div>

          <input
            id="signup-password"
            className="input"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <p className="hint">At least 6 characters.</p>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
          <Link className="btn btn-ghost" to="/login">I have an account</Link>
        </div>
      </form>
    </div>
  );
}
