import axios from "axios";
import Cookies from "js-cookie";

/**
 * Configured axios instance.
 *
 * WHY this exists now, before the backend:
 * All pages use this instance via the SWR hooks in lib/api.js.
 * The Sanctum bearer token is injected on every request; 401 responses
 * clear the session and redirect to /login automatically.
 *
 * The token lives in an httpOnly cookie set by the server in production. In the
 * browser we can't read httpOnly cookies, so for local dev we mirror a readable
 * "sembly_token" cookie purely to attach the Authorization header. Production
 * uses `withCredentials` so the httpOnly cookie rides along automatically.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true, // send the Sanctum cookie on cross-site requests
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// Request: attach bearer token if we have a readable copy (dev convenience).
api.interceptors.request.use((config) => {
  const token = Cookies.get("sembly_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: bubble up clean errors; auto-logout on 401 so a dead session
// doesn't leave the user stuck on a half-broken page.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("sembly_token");
      // Avoid redirect loops on the login page itself.
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
