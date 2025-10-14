import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth.js";
import api from "@/lib/api";
import NewRecordModal from "@/components/NewRecordModal.jsx";
import ManageRecordModal from "@/components/ManageRecordModal.jsx";
import ViewDocumentsModal from "@/components/ViewDocumentsModal.jsx";
import "@/styles/category.css";
import "@/styles/records-dashboard.css";

function timeAgo(iso) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} week${w > 1 ? "s" : ""} ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} month${m > 1 ? "s" : ""} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

function RecordCard({ r, onManage, onDocs }) {
  const d = r.details || {};
  const t = (d.type || "").toLowerCase();

  const start = r.startDate ? new Date(r.startDate).toLocaleDateString() : "-";
  const end = r.endDate ? new Date(r.endDate).toLocaleDateString() : "-";
  const docs = (r.documentsCount ?? (r.documents?.length ?? 0)).toString().padStart(2, "0");

  return (
    <div className="edu-item">
      <div className="edu-grid">
        <div className="edu-thumb" aria-hidden="true" />

        {/* LEFT column varies by category */}
        <div className="edu-col">
          <h4>{r.title || "Untitled"}</h4>

          {t === "education" && (
            <ul className="edu-meta">
              {d.program ? <li>Program: {d.program}</li> : null}
              <li>Start Date: {start}</li>
              <li>End Date: {end}</li>
            </ul>
          )}

          {t === "career" && (
            <ul className="edu-meta">
              {d.company ? <li>Company: {d.company}</li> : null}
              <li>Start Date: {start}</li>
              <li>End Date: {end}</li>
            </ul>
          )}

          {t === "travel" && (
            <ul className="edu-meta">
              {d.purpose ? <li>Purpose: {d.purpose}</li> : null}
              <li>Departure Date: {start}</li>
              <li>Arrival Date: {end}</li>
            </ul>
          )}
        </div>

        {/* varies by category */}
        <div className="edu-col">
          {t === "education" && (
            <>
              <h4>{d.institution || ""}</h4>
              <ul className="edu-meta">
                {d.address ? <li>Address: {d.address}</li> : null}
                {d.phone ? <li>Phone: {d.phone}</li> : null}
                <li>Documents Uploaded: {docs}</li>
              </ul>
            </>
          )}

          {t === "career" && (
            <>
              {/* <h4>{r.title || ""}</h4> */}
              <ul className="edu-meta">
              {d.employmentType ? <li>Type: {d.employmentType}</li> : null}
                {d.location ? <li>Location: {d.location}</li> : null}
                <li>Documents Uploaded: {docs}</li>
              </ul>
            </>
          )}

          {t === "travel" && (
            <>
              <h4>
                {d.origin && d.destination
                  ? `${d.origin} → ${d.destination}`
                  : (d.destination || d.origin || "")}
              </h4>
              <ul className="edu-meta">
                {d.origin ? <li>Origin: {d.origin}</li> : null}
                {d.destination ? <li>Destination: {d.destination}</li> : null}
                <li>Documents Uploaded: {docs}</li>
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="edu-foot">
        <span>Last Updated: {timeAgo(r.updatedAt || r.createdAt)}</span>
        <div className="edu-actions">
          <button className="edu-link" onClick={() => onManage(r._id)}>Manage Record</button>
          <button className="edu-link" onClick={() => onDocs(r._id)}>View Documents</button>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { categoryName } = useParams();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [manageId, setManageId] = useState(null);
  const [docsId, setDocsId] = useState(null);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (loading || !user) return;
      setBusy(true); setErr("");
      try {
        const data = await api.getRecordsByCategory(categoryName);
        if (!ignore) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Could not load records.");
      } finally {
        if (!ignore) setBusy(false);
      }
    })();
    return () => { ignore = true; };
  }, [categoryName, user, loading, rev]);

  if (loading || busy) return <p>Loading…</p>;
  if (err) return <p className="text-error">{err}</p>;

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-head">
          <h3 className="dashboard-title">{categoryName}</h3>
          <div className="dashboard-tools">
            <button className="dashboard-tool" onClick={() => setShowNew(true)}>Add Record</button>
            <span className="dashboard-tool">Sort</span>
            <span className="dashboard-tool">Share</span>
            <span className="dashboard-tool">Download Records</span>
          </div>
        </div>

        <div className="edu-list">
          {rows.length === 0 && <p className="muted">No records yet.</p>}
          {rows.map((r) => (
            <RecordCard
              key={r._id}
              r={r}
              onManage={(id) => setManageId(id)}
              onDocs={(id) => setDocsId(id)}
            />
          ))}
        </div>
      </div>

      {showNew && (
        <NewRecordModal
          categoryName={categoryName}
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); setRev(v => v + 1); }}
        />
      )}
      {manageId && (
        <ManageRecordModal
          recordId={manageId}
          onClose={() => setManageId(null)}
          onSaved={() => { setManageId(null); setRev(v => v + 1); }}
        />
      )}
      {docsId && (
        <ViewDocumentsModal
          recordId={docsId}
          onClose={() => setDocsId(null)}
        />
      )}
    </div>
  );
}
