import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/use-auth.js";
import "@/styles/login.css";
import "@/styles/form.css";
import "@/styles/buttons.css";

export default function AdminLoginPage() {
  const { adminLogin } = useAuth(); // to add in auth logic
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      await adminLogin(email, password);
      nav("/admin/dashboard"); // redirect to admin area
    } catch (e) {
      setErr(e.message || "Admin login failed");
    }
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={onSubmit}>
        <h2>Admin Login</h2>
        {err && <div className="alert">{err}</div>}

        <div className="field">
          <label className="label" htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit">
            Admin Log in
          </button>
        </div>
      </form>
    </div>
  );
}
