import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const OPTIONS = [
  { label: "Recently updated",    value: "-updatedAt" },
  { label: "Oldest updated",      value: "updatedAt" },
  { label: "Date (newest first)", value: "-date" },
  { label: "Date (oldest first)", value: "date" },
];

function getLabel(v) {
  const m = OPTIONS.find(o => o.value === v);
  return m ? m.label : OPTIONS[0].label;
}

export default function SortMenu() {
  const [sp, setSp] = useSearchParams();
  const current = sp.get("sort") || "-updatedAt";

  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function choose(val) {
    sp.set("sort", val);
    setSp(sp, { replace: true });
    setOpen(false);
  }

  return (
    <div className="sortmenu">
      <button
        ref={btnRef}
        type="button"
        className="sortmenu__button btn"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
            setTimeout(() => menuRef.current?.querySelector(".sortmenu__item")?.focus(), 0);
          }
        }}
      >
        <span className="sortmenu__label">Sort: {getLabel(current)}</span>
        <span className="sortmenu__caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="sortmenu__popover"
        >
          {OPTIONS.map(o => {
            const active = o.value === current;
            return (
              <button
                key={o.value}
                role="menuitemradio"
                aria-checked={active}
                className={`sortmenu__item${active ? " is-active" : ""}`}
                onClick={() => choose(o.value)}
                onKeyDown={(e) => {
                  const items = Array.from(menuRef.current.querySelectorAll(".sortmenu__item"));
                  const idx = items.indexOf(e.currentTarget);
                  if (e.key === "ArrowDown") {
                    e.preventDefault(); items[(idx + 1) % items.length].focus();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault(); items[(idx - 1 + items.length) % items.length].focus();
                  } else if (e.key === "Home") {
                    e.preventDefault(); items[0].focus();
                  } else if (e.key === "End") {
                    e.preventDefault(); items[items.length - 1].focus();
                  }
                }}
              >
                <span className="sortmenu__text">{o.label}</span>
                {active && <span className="sortmenu__check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
