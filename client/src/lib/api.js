import { auth } from "./firebase";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function authHeader() {
  const u = auth.currentUser;
  const token = u ? await u.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const authHdr = await authHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...authHdr,
      ...headers,
    },
    body,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    console.error("API error:", {
              url: `${API_BASE}${path}`,
              status: res.status,
              statusText: res.statusText,
              payload,
              hasAuth: !!authHdr.Authorization,
            });
    const msg =
      (payload && (payload.error || payload.message)) ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return payload;
}

/* ------------------------- PUBLIC API FUNCTIONS ------------------------- */

/** GET /categories  -> [{ _id, name }, ...] */
export async function getCategories() {
  return request(`/categories`);
}

/** GET /records?category=Education -> list of records for that category */
export async function getRecordsByCategory(categoryName) {
  const q = encodeURIComponent(categoryName);
  return request(`/records?category=${q}`);
}

/** POST /records  -> create new record
 *  payload shape depends on category (Education/Career/Travel, etc.)
 */
export async function createRecord(payload) {
  return request(`/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** GET /records/:id */
export async function getRecordById(id) {
  return request(`/records/${id}`);
}

/** PATCH /records/:id */
export async function updateRecord(id, partial) {
  return request(`/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partial),
  });
}

/** DELETE /records/:id */
export async function deleteRecord(id) {
  return request(`/records/${id}`, { method: "DELETE" });
}

/** GET /records/:id/documents */
export async function listDocuments(recordId) {
    return request(`/records/${recordId}/documents`);
  }
  
  /** POST /records/:id/documents (FormData: files[]) */
  export async function uploadDocuments(recordId, files) {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    return request(`/records/${recordId}/documents`, {
      method: "POST",
      body: form, 
    });
  }
  
  /** DELETE /records/:id/documents/:docId */
  export async function deleteDocument(recordId, docId) {
    return request(`/records/${recordId}/documents/${docId}`, { method: "DELETE" });
  }

// ------------------------- ADMIN API FUNCTIONS -------------------------
const admin = {
  async summary() {
    try { return await request("/admin/summary"); }
    catch { return { usersTotal: 0, usersActive: 0, recordsTotal: 0, uploadsTotal: 0 }; }
  },
  async listUsers({ q = "" } = {}) {
    try { return await request(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`); }
    catch { return []; }
  },
  async setUserActive(uid, active) {
    return request(`/admin/users/${uid}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !!active }),
    });
  },
  async setUserRole(uid, role) {
    return request(`/admin/users/${uid}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  },
};

export default {  getCategories,
  getRecordsByCategory,
  createRecord,
  getRecordById,
  updateRecord,
  deleteRecord,
  listDocuments,
  uploadDocuments,
  deleteDocument, admin };


