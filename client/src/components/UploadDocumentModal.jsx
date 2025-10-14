import { useState } from "react";
import api from "@/lib/api";
import { auth } from "@/lib/firebase";
import "@/styles/modal.css";
import "@/styles/form.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api/v1";

export default function UploadDocumentModal({ recordId, onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [names, setNames] = useState([]); // display names
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function onPick(e) {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setNames(list.map(f => f.name)); // default display names
  }

  function setNameAt(i, val) {
    setNames(prev => prev.map((n, idx) => (idx === i ? val : n)));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!files.length) return setErr("Please choose at least one file.");

    try {
      setBusy(true);

      if (typeof api.uploadDocuments === "function" && api.uploadDocuments.length >= 3) {
        await api.uploadDocuments(recordId, files, names);
      } else {
        // Fallback - direct POST with FormData
        const fd = new FormData();
        files.forEach(f => fd.append("files", f));
        names.forEach(n => fd.append("names[]", n));

        // Auth header
        const u = auth.currentUser;
        const token = u ? await u.getIdToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/records/${recordId}/documents`, {
          method: "POST",
          headers,
          body: fd,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || j.message || `HTTP ${res.status}`);
        }
      }

      onUploaded?.();
      onClose?.();
    } catch (e) {
      setErr(e.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div className="modal-backdrop" onMouseDown={onBackdrop}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="upl-title">
        <h3 id="upl-title">Upload Document(s)</h3>

        {err && <div className="alert">{err}</div>}

        <form onSubmit={submit} className="form">
          <div className="field">
            <label className="label" htmlFor="upl-files">Choose files</label>
            <input
              id="upl-files"
              type="file"
              className="input"
              multiple
              onChange={onPick}
            />
          </div>

          {/* Rename list */}
          {files.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="form-row" style={{ alignItems: "center" }}>
                  <div className="form-col">
                    <div className="muted" style={{ fontSize: 12 }}>
                      Original: {f.name}
                    </div>
                    <input
                      className="input"
                      value={names[i] || ""}
                      onChange={(e) => setNameAt(i, e.target.value)}
                      placeholder="Display name"
                      aria-label={`Display name for ${f.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button className="btn" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={busy || files.length === 0} aria-busy={busy}>
              {busy ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
