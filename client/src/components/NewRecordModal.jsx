import { useEffect, useRef, useState, useMemo } from "react";
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

// helpers
const RAW_BASE = import.meta.env.VITE_API_BASE || "";
let ORIGIN = "";
try { const u = new URL(RAW_BASE); ORIGIN = `${u.protocol}//${u.host}`; } catch { ORIGIN = window.location.origin; }
function absUrl(url){ if(!url)return"#"; if(/^https?:\/\//i.test(url))return url; return `${ORIGIN}${url.startsWith("/")?url:`/${url}`}`; }
function isImageMime(mime="",name=""){ if(/^image\//i.test(mime))return true; const ext=name.toLowerCase().split(".").pop(); return ["png","jpg","jpeg","gif","webp","bmp","svg"].includes(ext); }

export default function NewRecordModal({ categoryName, onClose, onSaved }) {
  const type = (categoryName || "").toLowerCase();

  const [categoryId, setCategoryId] = useState("");
  const [loadingCats, setLoadingCats] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // once created (for uploads)
  const [createdId, setCreatedId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  // shared
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // education
  const [program, setProgram] = useState("");
  const [institution, setInstitution] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // career
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");

  // travel
  const [purpose, setPurpose] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const firstFieldRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    (async () => {

      try {
        setErr(""); 
        setLoadingCats(true);
        const cats = await api.getCategories();
        const match = cats.find(c => c.name?.toLowerCase() === type);
        if (!ignore) setCategoryId(match?._id || "");
        if (!match) setErr(`Category "${categoryName}" not found.`);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load categories.");
      } finally {
        if (!ignore) setLoadingCats(false);
      }

    })();
    return () => { ignore = true; };
  }, [categoryName, type]);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const details = useMemo(() => {
    if (type === "education")
      return { type, program: program.trim(), institution: institution.trim(), address: address.trim(), phone: phone.trim() };
    if (type === "career")
      return { type, company: company.trim(), location: location.trim(), employmentType: employmentType.trim() };
    if (type === "travel")
      return { type, purpose: purpose.trim(), origin: origin.trim(), destination: destination.trim() };
    return { type };
  }, [type, program, institution, address, phone, company, location, employmentType, purpose, origin, destination]);

//  // replace validate() with:
// function validate() {
//     if (!categoryId) return "Category missing.";
//     if (!title.trim()) return "Title is required.";
//     if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
//     return "Start date cannot be after end date.";
//   }
//   return "";
// }
  
  async function ensureCreated() {
    if (createdId) return createdId;
    if (!categoryId) { setErr("Category missing."); return null; }
  
    try {
      setBusy(true);
      const row = await api.createRecord({
        categoryId,
        title: title.trim() || "Untitled",   // allow draft without user title
        startDate: startDate || null,
        endDate: endDate || null,
        details,
      });
      if (!row?._id) throw new Error("Failed to create record.");
      setCreatedId(row._id);
      setDocuments(Array.isArray(row?.documents) ? row.documents : []);
      return row._id;
    } catch (e) {
      setErr(e.message || "Save failed.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  

  async function refreshDocs() {
    if (!createdId) return;
    const row = await api.getRecordById(createdId);
    setDocuments(Array.isArray(row?.documents) ? row.documents : []);
  }

  async function onUploadClick() {
    const id = await ensureCreated(); // validates title, etc.
    if (!id) return;
    setShowUpload(true);
  }

  async function onSaveAndClose(e) {
    e.preventDefault();
    const id = await ensureCreated();
    if (!id) return;
   
    onSaved?.();    
    onClose?.();     
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <>
      <div className="modal-backdrop" onMouseDown={onBackdrop}>
        <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-title">
          <div className="manage">
            <div className="manage-bar">
              <h3 id="new-title" className="manage-crumbs">{categoryName} › Add Record</h3>
              <div className="manage-actions">
                
                <button className="btn" type="button" onClick={onClose} disabled={busy}>Discard & Close</button>
                <button className="btn btn-primary" type="submit" form="new-record-form" disabled={busy || loadingCats} aria-busy={busy}>
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {err && <div className="alert text-error">{err}</div>}

            <div className="manage-body">
              <form id="new-record-form" onSubmit={onSaveAndClose}>

                {/* Education */}
                {type === "education" && (
                  <div className="grid-2">
                    <div>
                      <label className="label" htmlFor="ed-title">Credential Name</label>
                      <input id="ed-title" ref={firstFieldRef} className="input" value={title} onChange={e=>setTitle(e.target.value)} />
                      <div className="hint-inline">E.g., Bachelors, Postgraduate, Diploma, Training, Certificate, etc.</div>
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-inst">Institution Name</label>
                      <input id="ed-inst" className="input" value={institution} onChange={e=>setInstitution(e.target.value)} />
                      <div className="hint-inline">Name of the institution credentials is received from.</div>
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-prog">Program Name</label>
                      <input id="ed-prog" className="input" value={program} onChange={e=>setProgram(e.target.value)} />
                      <div className="hint-inline">Name of your program or training.</div>
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-addr">Institution Address</label>
                      <input id="ed-addr" className="input" value={address} onChange={e=>setAddress(e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-start">Start Date</label>
                      <input id="ed-start" className="input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-end">End Date</label>
                      <input id="ed-end" className="input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor="ed-phone">Institution’s Phone</label>
                      <input 
                      id="ed-phone"
                      className="input"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(123) 456-7890"
                      value={phone}
                      onChange={(e)=> setPhone(formatPhoneUS(e.target.value))}
                      pattern="^\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4}$"
                      title="Enter a 10-digit US/CA number, e.g. (416) 675-3111"
                    />
                    </div>
                  </div>
                )}

                {/* Career */}
                {type === "career" && (
                  <div className="grid-2">
                    <div>
                      <label 
                      className="label" 
                      htmlFor="car-title">Role / Title</label>
                      <input id="car-title" 
                      ref={firstFieldRef} 
                      className="input" 
                      value={title} 
                      onChange={e=>setTitle(e.target.value)} />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="car-company">Company</label>
                      <input id="car-company" 
                      className="input" 
                      value={company} 
                      onChange={e=>setCompany(e.target.value)} />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="car-loc">Location</label>
                      <input id="car-loc" 
                      className="input" 
                      value={location} 
                      onChange={e=>setLocation(e.target.value)} />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="car-type">Employment Type</label>
                      <input id="car-type" 
                      className="input" 
                      value={employmentType} 
                      onChange={e=>setEmploymentType(e.target.value)} 
                      placeholder="Full-time, Contract, Internship" />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="car-start">Start Date</label>
                      <input id="car-start" 
                      className="input" 
                      type="date" 
                      value={startDate} 
                      onChange={e=>setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="car-end">End Date</label>
                      <input id="car-end" 
                      className="input" 
                      type="date" 
                      value={endDate} 
                      onChange={e=>setEndDate(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Travel */}
                {type === "travel" && (
                  <div className="grid-2">
                    <div>
                      <label 
                      className="label" 
                      htmlFor="tr-title">Title
                      </label>
                      <input id="tr-title" 
                      ref={firstFieldRef} className="input" 
                      value={title} 
                      onChange={e=>setTitle(e.target.value)} />
                      <div className="hint-inline">e.g., Toronto Trip</div>
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="tr-origin">Origin</label>
                      <input id="tr-origin" 
                      className="input" 
                      value={origin} 
                      onChange={e=>setOrigin(e.target.value)} 
                      placeholder="City, Country" />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="tr-purpose">Purpose</label>
                      <input id="tr-purpose" 
                      className="input" 
                      value={purpose} 
                      onChange={e=>setPurpose(e.target.value)} 
                      placeholder="Conference, Vacation, Family visit" />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="tr-dest">Destination</label>
                      <input id="tr-dest" 
                      className="input" 
                      value={destination} 
                      onChange={e=>setDestination(e.target.value)} 
                      placeholder="City, Country" />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="tr-start">Departure Date</label>
                      <input id="tr-start" 
                      className="input" 
                      type="date" value={startDate} 
                      onChange={e=>setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label 
                      className="label" 
                      htmlFor="tr-end">Arrival Date</label>
                      <input id="tr-end" 
                      className="input" 
                      type="date" value={endDate} 
                      onChange={e=>setEndDate(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Upload roww */}
                <div className="upload-row">
                  <button type="button" 
                  className="btn" 
                  onClick={onUploadClick}
                  >
                    Upload Document
                  </button>
                </div>
                
                {/* live count */}
                <div className="doc-count-row">
                <span>Documents Uploaded: {String(documents?.length ?? 0).padStart(2, "0")}</span>
                </div>

               {/* inline doc cards */}
                <div className="doc-grid">
                {(!documents || documents.length === 0) ? (
                    <div className="muted">No documents yet.</div>
                ) : (
                    documents.map((doc, index) => {
                    const key  = doc._id || doc.id || index;
                    const name = doc.displayName || doc.originalName || doc.filename || doc.name || "Document";
                    const mime = doc.mimeType || doc.type || "";
                    const url  = absUrl(doc.url || doc.viewUrl || doc.downloadUrl || "");
                    const kind = (mime.split("/")[1] || "file").toUpperCase();
                    const isImg = isImageMime(mime, name);

                    const handleRemove = async () => {
                        if (!confirm("Remove this file from the record?")) return;

                        // optimistic remove
                        const prev = documents;
                        const next = documents.filter((_, i) => i !== index);
                        setDocuments(next);

                        try {
                        const docId = doc._id || doc.id;
                        if (createdId && docId) {
                            await api.deleteDocument(createdId, docId);
                            await refreshDocs(); // ensure server truth
                        }
                 
                        } catch (err) {
                        console.error("Remove failed:", err);
                    
                        setDocuments(prev);
                        alert(err?.message || "Failed to remove document.");
                        }
                    };

                    return (
                        <div key={key} className="doc-card">
                        <div className="doc-thumb">
                            {isImg ? (
                            <img
                                className="doc-thumb-img"
                                src={url}
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
                            {url && url !== `${ORIGIN}#` ? (
                            <a
                                className="doc-link"
                                href={url}
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
                            onClick={handleRemove}
                            title="Remove this file"
                            >
                            Remove
                            </button>
                        </div>
                        </div>
                    );
                    })
                )}
                </div>



                <div className="manage-foot">
                  <span></span>
                  <span>Click ‘Save’ to create the record.</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showUpload && createdId && (
        <UploadDocumentModal
          recordId={createdId}
          onClose={() => setShowUpload(false)}
          onUploaded={async () => { setShowUpload(false); await refreshDocs(); }}
        />
      )}
    </>
  );
}
