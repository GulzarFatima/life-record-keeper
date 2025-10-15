import { useEffect, useState } from "react";
import api from "@/lib/api";
import "@/styles/modal.css";
import "@/styles/form.css";
import "@/styles/manage-record.css";
import UploadDocumentModal from "@/components/UploadDocumentModal.jsx";

function digits(s){ return (s || "").replace(/\D/g, ""); }
function formatPhoneUS(v){
  const d = digits(v).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}

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

function isImageMime(mime = "", name = "") {
  if (/^image\//i.test(mime)) return true;
  if (name) {
    const ext = name.toLowerCase().split(".").pop();
    return ["png","jpg","jpeg","gif","webp","bmp","svg"].includes(ext);
  }
  return false;
}


export default function ManageRecordModal({ recordId, onClose, onSaved }) {
  const [v, setV] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setErr(""); setBusy(true);
        const row = await api.getRecordById(recordId);
        const t = (row?.details?.type || "").toLowerCase();
        if (!ignore) {
          setV({
            _id: row._id,
            title: row.title || "",
            startDate: row.startDate || "",
            endDate: row.endDate || "",
            details: {
              type: t || "",
              // education
              program: row?.details?.program || "",
              institution: row?.details?.institution || "",
              address: row?.details?.address || "",
              phone: row?.details?.phone || "",
              // career
              company: row?.details?.company || "",
              location: row?.details?.location || "",
              employmentType: row?.details?.employmentType || "",
              // travel
              purpose: row?.details?.purpose || "",
              origin: row?.details?.origin || "",
              destination: row?.details?.destination || "",
            },
            documents: Array.isArray(row?.documents) ? row.documents : [],
            updatedAt: row.updatedAt || row.createdAt || null,
          });
        }
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load record.");
      } finally {
        if (!ignore) setBusy(false);
      }
    })();
    return () => { ignore = true; };
  }, [recordId]);

  function setDetails(patch) {
    setV(prev => ({ ...prev, details: { ...prev.details, ...patch } }));
  }
  function dateStr(x) { return x ? String(x).slice(0, 10) : ""; }
  function fmtDate(x) { try { return x ? new Date(x).toLocaleDateString() : ""; } catch { return ""; } }

  async function submit(e) {
    e.preventDefault();
    if (!v) return;
    setErr("");
    try {
      setSaving(true);
      const t = (v.details?.type || "").toLowerCase();
      let details = { type: t };
      if (t === "education") {
        details = {
          type: "education",
          program: v.details.program?.trim() || "",
          institution: v.details.institution?.trim() || "",
          address: v.details.address?.trim() || "",
          phone: v.details.phone?.trim() || "",
        };
      } else if (t === "career") {
        details = {
          type: "career",
          company: v.details.company?.trim() || "",
          location: v.details.location?.trim() || "",
          employmentType: v.details.employmentType?.trim() || "",
        };
      } else if (t === "travel") {
        details = {
          type: "travel",
          purpose: v.details.purpose?.trim() || "",
          origin: v.details.origin?.trim() || "",
          destination: v.details.destination?.trim() || "",
        };
      }

      await api.updateRecord(recordId, {
        title: v.title?.trim(),
        startDate: v.startDate || null,
        endDate: v.endDate || null,
        
        details,
      });
      onSaved?.();
    } catch (e) {
      setErr(e.message || "Update failed.");
    } finally { setSaving(false); }
  }

  async function refresh() {
    try {
      const row = await api.getRecordById(recordId);
      setV(prev => ({
        ...prev,
        documents: Array.isArray(row?.documents) ? row.documents : [],
        updatedAt: row.updatedAt || row.createdAt || prev.updatedAt
      }));
    } catch { /* ignore */ }
  }

  async function onDelete() {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    try {
      setDeleting(true);
      await api.deleteRecord(recordId);
      onSaved?.();
    } catch (e) {
      setErr(e.message || "Delete failed.");
    } finally { setDeleting(false); }
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  if (busy && !v) {
    return (
      <div className="modal-backdrop" onMouseDown={onBackdrop}>
        <div className="modal-card">Loading…</div>
      </div>
    );
  }

  const type = (v?.details?.type || "").toLowerCase();

  return (
    <>
      <div className="modal-backdrop" onMouseDown={onBackdrop}>
        <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="manage-title">
          <div className="manage">
            <div className="manage-bar">
              <h3 id="manage-title" className="manage-crumbs">Manage Record</h3>
              <div className="manage-actions">
                <button className="btn btn-danger" onClick={onDelete} disabled={saving || deleting} aria-busy={deleting}>
                  {deleting ? "Deleting…" : "Delete Record"}
                </button>
                <button className="btn" onClick={onClose} disabled={saving || deleting}>Discard & Close</button>
                <button className="btn btn-primary" onClick={submit} disabled={saving || deleting} aria-busy={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {err && <div className="alert text-error">{err}</div>}

            <div className="manage-body">
              <form onSubmit={submit}>
                {type === "education" && (
                  <div className="grid-2">
                    <div>
                      <label className="label" htmlFor="ed-title">Credential Name</label>
                      <input id="ed-title" className="input"
                        value={v.title} onChange={e=>setV({...v, title: e.target.value})} />
                      <div className="hint-inline">E.g., Bachelors, Postgraduate, Diploma, Training, Certificate, etc.</div>
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-inst">Institution Name</label>
                      <input id="ed-inst" className="input"
                        value={v.details.institution} onChange={e=>setDetails({ institution: e.target.value })} />
                      <div className="hint-inline">Name of the institution credentials is received from.</div>
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-prog">Program Name</label>
                      <input id="ed-prog" className="input"
                        value={v.details.program} onChange={e=>setDetails({ program: e.target.value })} />
                      <div className="hint-inline">Name of your program or training.</div>
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-addr">Institution Address</label>
                      <input id="ed-addr" className="input"
                        value={v.details.address} onChange={e=>setDetails({ address: e.target.value })} />
                      <div className="hint-inline">Full address of the institution.</div>
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-start">Start Date</label>
                      <input id="ed-start" className="input" type="date"
                        value={dateStr(v.startDate)} onChange={e=>setV({...v, startDate: e.target.value || null})} />
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-end">End Date</label>
                      <input id="ed-end" className="input" type="date"
                        value={dateStr(v.endDate)} onChange={e=>setV({...v, endDate: e.target.value || null})} />
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-phone">Institution’s Phone</label>
                      <input
                      id="ed-phone"
                      className="input"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(416) 675-3111"
                      value={v.details.phone}
                      onChange={(e)=> setDetails({ phone: formatPhoneUS(e.target.value) })}
                      pattern="^\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4}$"
                      title="Enter a 10-digit US/CA number, e.g. (416) 675-3111"
                    />
                    </div>
                    
                  </div>
                )}

                {type === "career" && (
                  <div className="grid-2">
                    <div>
                      <label className="label" htmlFor="car-title">Role / Title</label>
                      <input id="car-title" className="input"
                        value={v.title} onChange={e=>setV({...v, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="label" htmlFor="car-company">Company</label>
                      <input id="car-company" className="input"
                        value={v.details.company} onChange={e=>setDetails({ company: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor="car-loc">Location</label>
                      <input id="car-loc" className="input"
                        value={v.details.location} onChange={e=>setDetails({ location: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor="car-type">Employment Type</label>
                      <input id="car-type" className="input" placeholder="Full-time, Contract, Internship"
                        value={v.details.employmentType} onChange={e=>setDetails({ employmentType: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor="car-start">Start Date</label>
                      <input id="car-start" className="input" type="date"
                        value={dateStr(v.startDate)} onChange={e=>setV({...v, startDate: e.target.value || null})} />
                    </div>
                    <div>
                      <label className="label" htmlFor="car-end">End Date</label>
                      <input id="car-end" className="input" type="date"
                        value={dateStr(v.endDate)} onChange={e=>setV({...v, endDate: e.target.value || null})} />
                    </div>
                    
                  </div>
                )}

                {type === "travel" && (
                  <div className="grid-2">
                    <div>
                      <label className="label" htmlFor="tr-title">Title</label>
                      <input id="tr-title" className="input"
                        value={v.title} onChange={e=>setV({...v, title: e.target.value})} />
                      <div className="hint-inline">e.g., Toronto Trip</div>
                    </div>
                    <div>
                      <label className="label" htmlFor="tr-origin">Origin</label>
                      <input id="tr-origin" className="input"
                        value={v.details.origin} onChange={e=>setDetails({ origin: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor="tr-purpose">Purpose</label>
                      <input id="tr-purpose" className="input"
                        value={v.details.purpose} onChange={e=>setDetails({ purpose: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor="tr-dest">Destination</label>
                      <input id="tr-dest" className="input"
                        value={v.details.destination} onChange={e=>setDetails({ destination: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor="tr-start">Departure Date</label>
                      <input id="tr-start" className="input" type="date"
                        value={dateStr(v.startDate)} onChange={e=>setV({...v, startDate: e.target.value || null})} />
                    </div>
                    <div>
                      <label className="label" htmlFor="tr-end">Arrival Date</label>
                      <input id="tr-end" className="input" type="date"
                        value={dateStr(v.endDate)} onChange={e=>setV({...v, endDate: e.target.value || null})} />
                    </div>
                    
                  </div>
                )}


                <div className="upload-row">
                  <button type="button" className="btn" onClick={() => setShowUpload(true)}>
                    Upload Document
                  </button>
                </div>

                <div className="doc-grid">
                  {(v.documents || []).length === 0 ? (
                    <div className="muted">No documents yet.</div>
                  ) : (
                    v.documents.map((d, idx) => {
                      const id = d._id || d.id || idx;
                      const name = d.displayName || d.originalName || d.filename || d.name || "Document";
                      const mime = d.mimeType || d.type || "";
                      const viewUrl = absUrl(d.url || d.viewUrl || d.downloadUrl || "");
                      const kind = (mime.split("/")[1] || "file").toUpperCase();
                      const isImg = isImageMime(mime, name);

                      return (
                        <div key={id} className="doc-card">
                          <div className="doc-thumb">
                            {isImg ? (
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
                          <div className="doc-kind">{kind}</div>
                          <div className="doc-name" title={name}>{name}</div>
                          <div className="doc-links">
                            {viewUrl && viewUrl !== `${ORIGIN}#` ? (
                              <a
                                className="doc-link"
                                href={viewUrl}
                                target="_blank"
                                rel="noreferrer"

                                onClick={(e) => e.stopPropagation()}
                              >
                                View
                              </a>
                            ) : (
                              <span className="doc-link muted">View</span>
                            )}
                            
                            <button
                            type="button"
                            className="doc-link"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!confirm("Delete this document?")) return;

                              try {
                                const key = d._id || d.id || d.filename;
                                if (!key) throw new Error("Missing document id.");

                                await api.deleteDocument(recordId, key);
                                await refresh(); 
                              } catch (err) {
                                setErr(err?.message || "Delete failed.");
                              }
                            }}
                          >
                            Delete
                          </button>

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>


                <div className="manage-foot">
                  <span>Last Updated: {v.updatedAt ? fmtDate(v.updatedAt) : "—"}</span>
                  <span>Click ‘Save’ to save changes.</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showUpload && (
        <UploadDocumentModal
          recordId={recordId}
          onClose={() => setShowUpload(false)}
          onUploaded={refresh}
        />
      )}
    </>
  );
}
