const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export function getToken() {
  return localStorage.getItem("sud_token");
}

export function setSession(session) {
  localStorage.setItem("sud_token", session.token);
  localStorage.setItem("sud_user", JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem("sud_token");
  localStorage.removeItem("sud_user");
}

export function getUser() {
  const raw = localStorage.getItem("sud_user");
  return raw ? JSON.parse(raw) : null;
}

export async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro de comunicacao." }));
    throw new Error(error.message || "Erro inesperado.");
  }

  if (response.status === 204) return null;
  return response.json();
}

export const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
