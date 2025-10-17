import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import "@/styles/admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        api.admin?.summary?.().catch(() => null),
        api.admin?.listUsers?.().catch(() => []), // no search param
      ]);
      setStats(s);
      setUsers(Array.isArray(u) ? u : []);
    } catch (e) {
      setErr(e?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const activeUsers = useMemo(() => {
    if (!Array.isArray(users)) return 0;
    return users.filter(u => (u.active !== false) && (u.disabled !== true)).length;
  }, [users]);

  async function toggleActive(u) {
    try {
      await api.admin.setUserActive(u.uid, !(u.active !== false && u.disabled !== true));
      await load();
    } catch (e) {
      alert(e.message || "Failed to update user.");
    }
  }

  async function toggleRole(u) {
    const next = u.role === "admin" ? "user" : "admin";
    try {
      await api.admin.setUserRole(u.uid, next);
      await load();
    } catch (e) {
      alert(e.message || "Failed to update role.");
    }
  }

  return (
    <div className="admin-wrap">
      <div className="admin-head">
        <h2>Admin Dashboard</h2>
      </div>

      {err && <div className="alert text-error">{err}</div>}

      <div className="cards">
        <div className="card">
          <div className="kpi">{stats?.usersCount ?? stats?.usersTotal ?? "—"}</div>
          <div className="kpi-label">Total Users</div>
        </div>
        <div className="card">
          <div className="kpi">{activeUsers || (activeUsers === 0 ? 0 : "—")}</div>
          <div className="kpi-label">Active Users</div>
        </div>
        <div className="card">
          <div className="kpi">{stats?.recordsCount ?? stats?.recordsTotal ?? "—"}</div>
          <div className="kpi-label">Total Records</div>
        </div>
      </div>

      {/* Records by Category — styled bar list */}
      {Array.isArray(stats?.categories) && stats.categories.length > 0 && (
  <div className="admin-section">
    <div className="section-head">
      <h3>Records by category</h3>
    </div>

    {(() => {
      const total = stats.categories.reduce((s, c) => s + (c?.count ?? 0), 0) || 0;
      const rows = [...stats.categories]
        .map(c => ({ name: c?.name || "Unknown", count: c?.count ?? 0 }))
        .sort((a, b) => b.count - a.count);

      return (
        <div className="cat-list clean-list">
          {rows.map((c, idx) => {
            const pct = total ? Math.round((c.count / total) * 100) : 0;
            return (
              <div className="cat-row--simple" key={`${c.name}-${idx}`}>
                <div className="cat-name">{c.name}</div>
                <div className="cat-meta">
                  <span className="badge-count">{c.count}</span>
                  <span className="badge-pct">{pct}%</span>
                </div>
              </div>
            );
          })}
          {/* <div className="cat-total">
            <span>Total</span>
            <span className="badge-total">{total}</span>
          </div> */}
        </div>
      );
    })()}
  </div>
)}


      <div className="admin-section">
        <div className="section-head">
          <h3>Users</h3>
        </div>

        <div className="table">
          <div className="thead">
            <div>Email</div>
            <div>Name</div>
            <div>Role</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="tbody">
            {users?.length ? (
              users.map((u, i) => (
                <div key={u.uid || u._id || u.email || i} className="tr">
                  <div>{u.email}</div>
                  <div>{u.displayName || u.name || "—"}</div>
                  <div>{u.role || "user"}</div>
                  <div>{(u.active === false || u.disabled === true) ? "Inactive" : "Active"}</div>
                  <div className="row-actions">
                    <button className="link" onClick={() => toggleActive(u)}>
                      {(u.active === false || u.disabled === true) ? "Activate" : "Deactivate"}
                    </button>
                    <span className="sep">·</span>
                    <button className="link" onClick={() => toggleRole(u)}>
                      {u.role === "admin" ? "Make user" : "Make admin"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty">{loading ? "Loading…" : "No users."}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
