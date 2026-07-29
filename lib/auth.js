import Cookies from "js-cookie";
import api from "./axios";
import { useStore } from "./store";

/**
 * auth.js — login / logout / session rehydration against the Laravel API.
 *
 *   login()            POST /auth/login  → stores bearer token, seeds the store
 *   logout()           POST /auth/logout → clears token + store
 *   bootstrapSession() GET  /auth/me     → rehydrates the store on reload
 *
 * The token is kept in a cookie so it survives reloads; the axios interceptor
 * attaches it as `Authorization: Bearer …` on every request.
 */
const COOKIE_OPTS = {
  expires: 7,
  sameSite: "lax",
  // domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN, // enable in prod across subdomains
};

function applySession(payload) {
  useStore.getState().setSession({ user: payload.user, school: payload.school });
  if (payload.school?.default_template_id) {
    useStore.getState().setDefaultTemplate(payload.school.default_template_id);
  }
}

export async function login({ email, password, schoolSlug }) {
  const { data } = await api.post("/auth/login", { email, password, school_slug: schoolSlug });
  Cookies.set("sembly_token", data.data.token, COOKIE_OPTS);
  applySession(data.data);
  return data.data; // { user, school, token }
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore network/401 — we clear locally regardless
  }
  Cookies.remove("sembly_token");
  useStore.getState().clearSession();
}

export function isAuthenticated() {
  return Boolean(Cookies.get("sembly_token"));
}

/**
 * setPassword — completes an invite or a forgot-password link.
 * POST /auth/reset-password with the token + email from the emailed link,
 * plus the new password. Same endpoint serves both flows (see
 * PasswordResetController::reset() on the backend) — from the frontend's
 * point of view it's just "finish setting my password".
 */
export async function setPassword({ email, token, password, passwordConfirmation }) {
  const { data } = await api.post("/auth/reset-password", {
    email,
    token,
    password,
    password_confirmation: passwordConfirmation,
  });
  return data.data;
}

/** POST /auth/forgot-password — request a reset link for an existing account. */
export async function requestPasswordReset({ email }) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data.data;
}

/** Rehydrate the session on app boot. Returns the user, or null if not signed in. */
export async function bootstrapSession() {
  if (!isAuthenticated()) return null;
  try {
    const { data } = await api.get("/auth/me");
    applySession(data.data);
    return data.data.user;
  } catch {
    Cookies.remove("sembly_token");
    return null;
  }
}