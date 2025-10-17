import { useState } from "react";
import api from "@/lib/api";
import "@/styles/modal.css";

export default function ShareModal({ categoryName, onClose }) {
  const [includeDocs, setIncludeDocs] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [link, setLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  async function onCreate() {
    try {
      setBusy(true); setErr("");
      const res = await api.createCategoryShare({ categoryName, includeDocs, ttlHours: 72 });
      setLink(res.url);
      setExpiresAt(res.expiresAt);
    } catch (e) {
      setErr(e?.message || "Could not create share link.");
    } finally {
      setBusy(false);
    }
  }

  function onCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link).catch(() => {});
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card share">
        <div className="manage-bar">
          <h3 className="modal-title">Share {categoryName}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="manage-body">
          <p className="muted">Choose what to include in the shared view.</p>

          <fieldset className="choice">
            <legend className="choice__legend">Options</legend>

            <label className="choice__row">
              <input
                type="checkbox"
                checked={includeDocs}
                onChange={() => setIncludeDocs(true)}
              />
              <span>Share records <strong>with documents</strong></span>
            </label>

            <label className="choice__row">
              <input
                type="checkbox"
                checked={!includeDocs}
                onChange={() => setIncludeDocs(false)}
              />
              <span>Share records <strong>without documents</strong></span>
            </label>

            <p className="muted small">Only one option can be selected at a time.</p>
          </fieldset>

          {err && <div className="error">{err}</div>}

          {!link ? (
            <button className="btn" onClick={onCreate} disabled={busy}>
              {busy ? "Creating…" : "Create Share Link"}
            </button>
          ) : (
            <div className="share-result">
              <label className="share-result__label">Share link</label>
              <div className="share-result__row">
                <input className="input" readOnly value={link} onFocus={e => e.target.select()} />
                <button className="btn" onClick={onCopy}>Copy link</button>
              </div>
              {expiresAt && (
                <p className="muted small">Expires: {new Date(expiresAt).toLocaleString()}</p>
              )}
              <a className="btn btn--ghost" href={link} target="_blank" rel="noreferrer">
                See as Viewer
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
