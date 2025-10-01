import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

export default function NewRecordModal({ categoryName, onClose, onSaved }) {
  const [categoryId, setCategoryId] = useState("");
  const [catsLoading, setCatsLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [highlight, setHighlight] = useState(false);
  const [tags, setTags] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const titleRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setErr("");
        setCatsLoading(true);
        const cats = await api.getCategories();
        const match = cats.find(
          (c) => c.name?.toLowerCase() === categoryName.toLowerCase()
        );
        if (!ignore) {
          if (match?._id) setCategoryId(match._id);
          else setErr(`Category "${categoryName}" not found.`);
        }
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load categories.");
      } finally {
        if (!ignore) setCatsLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [categoryName]);

  useEffect(() => {

    // Autofocus title when modal opens

    titleRef.current?.focus();
    // Close on ESC
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!categoryId) return setErr("Category missing.");
    if (!title.trim()) return setErr("Title is required.");
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return setErr("Start date cannot be after end date.");
    }

    try {
      setBusy(true);
      await api.createRecord({
        categoryId,
        title: title.trim(),
        notes: notes.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        highlight,
        tags: tags
          ? tags.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        details: { type: categoryName.toLowerCase() },
      });
      onSaved?.(); // parent will close & refresh
      
    } catch (e) {
      setErr(e.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div style={backdrop} onMouseDown={onBackdrop}>
      <div style={card} role="dialog" aria-modal="true" aria-labelledby="new-record-title">
        <h3 id="new-record-title" style={{ marginTop: 0 }}>
          New {categoryName} record
        </h3>

        {err && <div className="alert" style={{ marginBottom: 12 }}>{err}</div>}
        {catsLoading && <p className="muted" style={{ marginTop: 0 }}>Loading categories…</p>}

        <form onSubmit={submit}>
          <label className="label">Title</label>
          <input
            ref={titleRef}
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="form-row">
            <div className="form-col">
              <label className="label">Start date</label>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-col">
              <label className="label">End date</label>
              <input
                className="input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="form-col form-col--checkbox">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={highlight}
                  onChange={(e) => setHighlight(e.target.checked)}
                />
                Highlight
              </label>
            </div>
          </div>

          <label className="label">Tags (comma separated)</label>
          <input
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="graduation, visa"
          />

          <label className="label">Notes</label>
          <textarea
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={busy || catsLoading || !categoryId}
              aria-busy={busy}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const card = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow)",
  padding: "16px",
  width: "min(560px, 92vw)",
};
