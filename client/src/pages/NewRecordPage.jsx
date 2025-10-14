import api from "@/lib/api";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@/styles/login.css";
import "@/styles/form.css";
import "@/styles/buttons.css";

export default function NewRecordPage() {
  const nav = useNavigate();
  const { categoryName } = useParams();

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const categories = await api.getCategories();
        const match = categories.find(
          (c) => c.name?.toLowerCase() === categoryName.toLowerCase()
        );
        if (!ignore) {
          if (match?._id) setCategoryId(match._id);
          else setErr(`Category "${categoryName}" not found for this user.`);
        }
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load categories.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [categoryName]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!categoryId) return setErr("Category missing. Please go back and try again.");
    if (!title.trim()) return setErr("Title is required.");

    try {
      setSaving(true);
      await api.createRecord({
        categoryId,
        title: title.trim(),
        notes: notes.trim(),
        details: { type: categoryName.toLowerCase() }, 
      });
      nav(`/categories/${categoryName}`);
    } catch (e) {
      setErr(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="nr-form"><p>Loading…</p></div>;
  if (err) {
    return (
      <div className="nr-form">
        <h2 className="nr-title">New {categoryName} Record</h2>
        <p className="nr-error">{err}</p>
      </div>
    );
  }

  return (
    <form className="nr-form" onSubmit={submit}>
      <h2 className="nr-title">New {categoryName} Record</h2>

      <label className="nr-label" htmlFor="nr-title">Title</label>
      <input
        id="nr-title"
        className="nr-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <label className="nr-label" htmlFor="nr-notes">Notes</label>
      <textarea
        id="nr-notes"
        className="nr-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {err && <div className="alert" style={{marginTop:12}}>{err}</div>}

      <div className="nr-actions">
        <button className="nr-btn" type="submit" disabled={saving} aria-busy={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
