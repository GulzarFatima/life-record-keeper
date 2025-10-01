import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth.js";
import api from "@/lib/api";
import NewRecordModal from "@/components/NewRecordModal.jsx";
import "@/styles/category.css";

export default function CategoryPage() {
  const { categoryName } = useParams();
  const { user, loading } = useAuth();

  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (loading || !user) return;
      setBusy(true);
      setErr("");
      try {
        const data = await api.getRecordsByCategory(categoryName); // ?category=Education
        if (!ignore) setRows(data || []);
      } catch (e) {
        console.error("getRecordsByCategory failed:", e.message);
        if (!ignore) setErr(e?.message || "Could not load records.");
      } finally {
        if (!ignore) setBusy(false);
      }
    })();
    return () => { ignore = true; };
  }, [categoryName, user, loading, rev]);

  if (loading || busy) return <p>Loading…</p>;
  if (err) return <p style={{ color: "#b42318" }}>{err}</p>;

  return (
    <div className="category-page">
      <div className="category-header">
        <h2 className="category-title">{categoryName}</h2>
        <button className="add-record-btn" onClick={() => setShowNew(true)}>
          + Add Record
        </button>
      </div>

      {showNew && (
        <NewRecordModal
          categoryName={categoryName}
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); setRev(v => v + 1); }}
        />
      )}

      {rows.length === 0 && <p>No records yet.</p>}

      <div className="records-list">
        {rows.map((r) => (
          <div key={r._id} className="record-card">
            <div className="record-title">
              {r.highlight ? "⭐ " : ""}{r.title}
            </div>
            <div className="record-meta">
              Start: {r.startDate ? new Date(r.startDate).toLocaleDateString() : "-"} ·{" "}
              End: {r.endDate ? new Date(r.endDate).toLocaleDateString() : "-"} ·{" "}
              Docs: {r.documentsCount ?? 0}
              {r.tags?.length ? <> · Tags: {r.tags.join(", ")}</> : null}
            </div>
            <div className="record-actions">
              <button>Manage</button>
              <button>View Documents</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
