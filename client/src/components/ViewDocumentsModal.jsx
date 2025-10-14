import { useEffect, useState } from "react";
import api from "@/lib/api";
import "@/styles/modal.css";
import "@/styles/view-docs.css";

const RAW_BASE = import.meta.env.VITE_API_BASE || "";
let ORIGIN = "";
try {
  const u = new URL(RAW_BASE);
  ORIGIN = `${u.protocol}//${u.host}`;
} catch {
  ORIGIN = window.location.origin;
}

function absUrl(url) {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;
  return `${ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function isImageMime(mime, name) {
  if (mime && /^image\//i.test(mime)) return true;
  if (name) {
    const ext = name.toLowerCase().split(".").pop();
    return ["png","jpg","jpeg","gif","webp","bmp","svg"].includes(ext);
  }
  return false;
}

export default function ViewDocumentsModal({ recordId, onClose }) {
  const [rec, setRec] = useState(null);
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setErr(""); setBusy(true);
        const row = await api.getRecordById(recordId);
        const list =
          (row && Array.isArray(row.documents) && row.documents) ||
          (api.getRecordDocuments ? await api.getRecordDocuments(recordId) : []);
        if (!ignore) { setRec(row); setDocs(list || []); }
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load record.");
      } finally {
        if (!ignore) setBusy(false);
      }
    })();
    return () => { ignore = true; };
  }, [recordId]);

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  function fmtDate(v) {
    try { return v ? new Date(v).toLocaleDateString() : ""; } catch { return ""; }
  }

  if (busy && !rec) {
    return (
      <div className="modal-backdrop" onMouseDown={onBackdrop}>
        <div className="modal-card">Loading…</div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onMouseDown={onBackdrop}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="viewdocs-title">
        <div className="viewdocs">
          <div className="viewdocs-header">
            <h3 id="viewdocs-title" className="viewdocs-title">
              {rec?.title} &nbsp;&gt;&nbsp; View Documents
            </h3>
            <button className="viewdocs-close" onClick={onClose} aria-label="Close">Close</button>
          </div>

          {err && <div className="alert text-error">{err}</div>}

          <div className="viewdocs-body">
            <div className="doc-grid">
              {docs.length === 0 ? (
                <div className="muted">No documents yet.</div>
              ) : (
                docs.map((d, idx) => {
                  // stable key
                  const key = d._id || d.id || d.filename || `${idx}`;
                  const name = d.displayName || d.originalName || d.filename || d.name || "Document";
                  const mime = d.mimeType || d.type || "";
       
                  const viewUrl = absUrl(d.viewUrl || d.url || d.downloadUrl || "");
                  const dlUrl = absUrl(d.downloadUrl || d.url || d.viewUrl || "");
                  const imageThumb = isImageMime(mime, name);

                  return (
                    <div key={key} className="doc-card">
                      <div className="doc-thumb">
                      {imageThumb ? (
                        <img
                            className="doc-thumb-img"
                            src={viewUrl}
                            alt={name}
                            onError={(e) => {
                            e.currentTarget.classList.add("fallback");
                            e.currentTarget.src = `${import.meta.env.BASE_URL}images/file-placeholder.png`;
                            }}
                        />
                        ) : (
                        <img
                            className="doc-thumb-img fallback"
                            src={`${import.meta.env.BASE_URL}images/file-placeholder.png`}
                            alt=""
                        />
                        )}

                      </div>
                      <div className="doc-kind">{(mime.split("/")[1] || "FILE").toUpperCase()}</div>
                      <div className="doc-name">{name}</div>
                      <div className="doc-actions">
                        {viewUrl && viewUrl !== `${ORIGIN}#` ? (
                          <a
                            className="doc-action"
                            href={viewUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </a>
                        ) : (
                          <span className="doc-action muted">View</span>
                        )}
                        {dlUrl && dlUrl !== `${ORIGIN}#` ? (
                          <a
                            className="doc-action"
                            href={dlUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Download
                          </a>
                        ) : (
                          <span className="doc-action muted">Download</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="viewdocs-divider"></div>

            <div className="viewdocs-summary">
              <div className="summary-col">
                <h4>{rec?.title}</h4>
                <ul className="summary-list">
                  {rec?.details?.program && (
                    <li className="summary-item">Program: {rec.details.program}</li>
                  )}
                  {(rec?.startDate || rec?.endDate) && (
                    <>
                      <li className="summary-item">Start Date: {fmtDate(rec.startDate) || "-"}</li>
                      <li className="summary-item">End Date: {fmtDate(rec.endDate) || "-"}</li>
                    </>
                  )}
                  {Array.isArray(rec?.tags) && rec.tags.length > 0 && (
                    <li className="summary-item">Tags: {rec.tags.join(", ")}</li>
                  )}
                </ul>
              </div>

              <div className="summary-col">
                {rec?.details?.institution && <h4>{rec.details.institution}</h4>}
                <ul className="summary-list">
                  {rec?.details?.address && (
                    <li className="summary-item">Address: {rec.details.address}</li>
                  )}
                  {rec?.details?.phone && (
                    <li className="summary-item">Phone: {rec.details.phone}</li>
                  )}
                  <li className="summary-item">
                    Documents Uploaded: {String(docs.length).padStart(2, "0")}
                  </li>
                </ul>
              </div>
            </div>

            {rec?.notes && (
              <>
                <div className="viewdocs-divider"></div>
                <div className="summary-col">
                  <h4>Notes</h4>
                  <p>{rec.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
