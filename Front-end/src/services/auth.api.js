// REAL backend: talks to the Laravel API. Same function names and answers as auth.mock.js.
// Every function returns { ok: true, ... } or { ok: false, field?, message, ... }.
import { API_URL } from '../constants/config';

let token = null;
export const setToken = (t) => { token = t; };

async function request(path, { method = 'POST', body } = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, network: true, message: 'Cannot reach the server. Check your connection.' };
  }
  let data = {};
  try { data = await res.json(); } catch {}
  if (res.ok) return { ok: true, ...data };

  const errors = data.errors || {};
  const field = Object.keys(errors)[0];
  return {
    ...data,
    ok: false,
    status: res.status,
    field,
    message: field ? errors[field][0] : data.message || 'Something went wrong. Please try again.',
  };
}

// Laravel reports "Password must match." on the password field. The screens show it under Confirm.
const fixConfirm = (r) => (r.message === 'Password must match.' ? { ...r, field: 'confirm' } : r);

export async function login({ email, password, remember }) {
  const r = await request('/login', { body: { email, password, remember: !!remember } });
  if (r.status === 403 && r.needs_verification) return { ok: false, needsVerification: true, email: r.email, message: r.message };
  return r;
}

export async function register({ email, password, confirm }) {
  return fixConfirm(await request('/register', { body: { email, password, password_confirmation: confirm } }));
}

export async function verifyCode({ email, code }) {
  const r = await request('/verify-code', { body: { email, code } });
  if (r.status === 429) return { ...r, locked: true, lockedUntil: r.locked_until };
  return r;
}

export const resendCode = ({ email }) => request('/resend-code', { body: { email } });

export const forgotPassword = ({ email }) => request('/forgot-password', { body: { email } });

export async function resetPassword({ token: resetToken, email, password, confirm }) {
  return fixConfirm(await request('/reset-password', {
    body: { token: resetToken, email, password, password_confirmation: confirm },
  }));
}

// TODO: needs Google client IDs + expo-auth-session. Then send the id_token to POST /auth/google.
export async function googleSignIn() {
  return { ok: false, message: 'Google sign-in is not set up yet.' };
}

export const me = () => request('/me', { method: 'GET' });
export const logout = () => request('/logout');
