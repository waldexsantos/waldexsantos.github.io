// lib/api.js — cliente HTTP para as API routes

const BASE = "/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("sp_token") : null;
}

function headers(extra = {}) {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro na requisição");
  return data;
}

export const api = {
  // Auth
  login:    (body) => request("POST", "/auth/login", body),
  register: (body) => request("POST", "/auth/register", body),

  // Providers
  getProviders:    ()       => request("GET", "/providers"),
  getProvider:     (id)     => request("GET", `/providers/${id}`),
  createProvider:  (body)   => request("POST", "/providers", body),
  updateProvider:  (id, b)  => request("PUT", `/providers/${id}`, b),
  deleteProvider:  (id)     => request("DELETE", `/providers/${id}`),

  // Categories
  getCategories:   ()       => request("GET", "/categories"),
  createCategory:  (body)   => request("POST", "/categories", body),
  updateCategory:  (id, b)  => request("PUT", `/categories/${id}`, b),
  deleteCategory:  (id)     => request("DELETE", `/categories/${id}`),

  // Ratings
  rate: (body) => request("POST", "/ratings", body),

  // Comments
  getComments:     (status) => request("GET", `/comments${status ? `?status=${status}` : ""}`),
  sendComment:     (body)   => request("POST", "/comments", body),
  moderateComment: (id, status) => request("PATCH", `/comments/${id}`, { status }),

  // Users (admin)
  getUsers:    ()       => request("GET", "/users"),
  updateRole:  (id, role) => request("PATCH", `/users/${id}`, { role }),
  deleteUser:  (id)     => request("DELETE", `/users/${id}`),
};
