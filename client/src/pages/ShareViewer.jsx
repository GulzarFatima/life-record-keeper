import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import "@/styles/category.css";          
import "@/styles/records-dashboard.css";  

function time(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return ""; }
}

export default function ShareViewer() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const data = await api.loadPublicShare(token);
        if (!dead) setState({ loading: false, error: "", data });
      } catch (e) {
        if (!dead) setState({ loading: false, error: e?.message || "Failed to load share.", data: null });
      }
    })();
    return () => { dead = true; };
  }, [token]);

  if (state.loading) return <p className="muted">Loading shared view…</p>;
  if (state.error) return <p className="text-error">{state.error}</p>;

  const { category, items = [], includeDocs, expiresAt } = state.data || {};

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-head">
          <h3 className="dashboard-title">
            Shared {category?.name || "Category"} {includeDocs ? "(with documents)" : "(without documents)"}
          </h3>
          <div className="dashboard-tools">
            {expiresAt && <span className="dashboard-tool">Expires: {time(expiresAt)}</span>}
          </div>
        </div>

        <div className="edu-list">
          {items.length === 0 && <p className="muted">No records to show.</p>}
          {items.map((r) => (
            <div className="edu-item" key={r._id}>
              <div className="edu-grid">
                <div className="edu-thumb" aria-hidden="true" />
                <div className="edu-col">
                  <h4>{r.title || "Untitled"}</h4>
                  <ul className="edu-meta">
                    {r.startDate && <li>Start: {new Date(r.startDate).toLocaleDateString()}</li>}
                    {r.endDate && <li>End: {new Date(r.endDate).toLocaleDateString()}</li>}
                    {r.details?.type === "education" && r.details.program && <li>Program: {r.details.program}</li>}
                    {r.details?.type === "career" && r.details.company && <li>Company: {r.details.company}</li>}
                    {r.details?.type === "travel" && r.details.destination && <li>Destination: {r.details.destination}</li>}
                  </ul>
                </div>
                <div className="edu-col">
                  {!includeDocs ? (
                    <ul className="edu-meta"><li>Documents: hidden</li></ul>
                  ) : Array.isArray(r.documents) && r.documents.length ? (
                    <ul className="edu-meta">
                      {r.documents.map((d, i) => (
                        <li key={i}>
                          {d.name || d.key || "document"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="edu-meta"><li>No documents</li></ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
