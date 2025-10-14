import { useState } from "react";
import "@/styles/form.css";

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com";

export default function Support() {
  const [type, setType] = useState("issue");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!msg.trim()) return setErr("Please add a short message.");
    const subject = encodeURIComponent(`[${type}] Life Record Keeper feedback`);
    const body = encodeURIComponent(
      `Name: ${name || "-"}\nEmail: ${email || "-"}\nType: ${type}\n\n${msg}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="container">
      <div className="surface" style={{ padding: "1.25rem" }}>
        <h1>Feedback and Support</h1>
        <p className="muted">
          Share suggestions, report issues, or ask for help. Your feedback guides the roadmap.
        </p>

        {sent && (
          <div className="alert" role="status">
            Thank you. Your mail app should open. If not, email us at {SUPPORT_EMAIL}.
          </div>
        )}
        {err && (
          <div className="alert" role="alert">
            {err}
          </div>
        )}

        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="label" htmlFor="s-type">Type</label>
            <select id="s-type" className="input" value={type} onChange={e=>setType(e.target.value)}>
              <option value="issue">Issue</option>
              <option value="suggestion">Suggestion</option>
              <option value="question">Question</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="label" htmlFor="s-name">Name</label>
              <input id="s-name" className="input" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div className="form-col">
              <label className="label" htmlFor="s-email">Email</label>
              <input id="s-email" className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="form-col"></div>
          </div>

          <div className="field">
            <label className="label" htmlFor="s-msg">Message</label>
            <textarea id="s-msg" className="input" rows={6} value={msg} onChange={e=>setMsg(e.target.value)} />
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Send via Email</button>
          </div>
        </form>
      </div>
    </div>
  );
}
