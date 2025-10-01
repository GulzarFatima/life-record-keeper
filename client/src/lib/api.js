import { auth } from "./firebase";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/** Build Authorization header from Firebase auth (if logged in) */
async function authHeader() {
  const u = auth.currentUser;
  const token = u ? await u.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Unified fetch wrapper with JSON + error handling */
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

/** (Optional) GET /records/:id */
export async function getRecordById(id) {
  return request(`/records/${id}`);
}

/** (Optional) PATCH /records/:id */
export async function updateRecord(id, partial) {
  return request(`/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partial),
  });
}

/** (Optional) DELETE /records/:id */
export async function deleteRecord(id) {
  return request(`/records/${id}`, { method: "DELETE" });
}


export default {
  getCategories,
  getRecordsByCategory,
  createRecord,
  getRecordById,
  updateRecord,
  deleteRecord,
};
