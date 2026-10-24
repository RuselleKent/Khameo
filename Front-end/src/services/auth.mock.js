// MOCK BACKEND. Every function here is what a Laravel API call will replace later.
// Each one returns { ok: true, ...data } or { ok: false, field?, message }.
// Test account: alexreyes@gmail.com / _Password2026   |   verification code: 123456
import { getJSON, setJSON } from './storage';
import { MAX_CODE_ATTEMPTS, LOCKOUT_MINUTES } from '../constants/config';

const USERS_KEY = 'khameo.users';
const RESETS_KEY = 'khameo.resets';
const VALID_CODE = '123456';
const wait = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const norm = (e) => (e || '').trim().toLowerCase();

const SEED = [{ email: 'alexreyes@gmail.com', password: '_Password2026', verified: true, google: false }];

async function users() {
  const list = await getJSON(USERS_KEY, null);
  if (list) return list;
  await setJSON(USERS_KEY, SEED);
  return SEED;
}
const publicUser = (u) => ({ email: u.email });

// In-memory code attempt tracking (server side in real life)
const attempts = {};

export async function login({ email, password }) {
  await wait();
  const u = (await users()).find((x) => x.email === norm(email));
  if (!u) return { ok: false, field: 'email', message: 'No account found with this email.' };
  if (u.password !== password) return { ok: false, field: 'password', message: 'Incorrect password. Please try again.' };
  return { ok: true, user: publicUser(u), token: 'mock-token-' + Date.now() };
}

export async function register({ email, password }) {
  await wait();
  const list = await users();
  if (list.some((x) => x.email === norm(email)))
    return { ok: false, field: 'email', message: 'Email is already taken.' };
  list.push({ email: norm(email), password, verified: false, google: false });
  await setJSON(USERS_KEY, list);
  return { ok: true, email: norm(email), codeSent: true };
}

export async function verifyCode({ email, code }) {
  await wait();
  const key = norm(email);
  const a = (attempts[key] = attempts[key] || { count: 0, lockedUntil: 0 });
  if (Date.now() < a.lockedUntil)
    return { ok: false, locked: true, lockedUntil: a.lockedUntil, message: `Too many incorrect attempts. Please wait ${LOCKOUT_MINUTES} minutes.` };
  if (code !== VALID_CODE) {
    a.count += 1;
    if (a.count >= MAX_CODE_ATTEMPTS) {
      a.count = 0;
      a.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      return { ok: false, locked: true, lockedUntil: a.lockedUntil, message: `Too many incorrect attempts. Please wait ${LOCKOUT_MINUTES} minutes.` };
    }
    return { ok: false, message: 'Invalid code. Please check and try again.' };
  }
  a.count = 0;
  const list = await users();
  const u = list.find((x) => x.email === key);
  if (u) { u.verified = true; await setJSON(USERS_KEY, list); }
  return { ok: true, user: { email: key }, token: 'mock-token-' + Date.now() };
}

export async function resendCode({ email }) {
  await wait(300);
  return { ok: true };
}

export async function forgotPassword({ email }) {
  await wait();
  const u = (await users()).find((x) => x.email === norm(email));
  if (!u) return { ok: false, field: 'email', message: 'No account found with this email.' };
  const token = 'reset-' + Math.random().toString(36).slice(2, 10);
  const resets = await getJSON(RESETS_KEY, {});
  resets[token] = norm(email);
  await setJSON(RESETS_KEY, resets);
  // Real backend emails the link. The token is returned here only so the mock can open it.
  return { ok: true, devToken: token };
}

export async function resetPassword({ token, password }) {
  await wait();
  const resets = await getJSON(RESETS_KEY, {});
  const email = resets[token];
  if (!email) return { ok: false, message: 'This reset link is invalid or expired.' };
  const list = await users();
  const u = list.find((x) => x.email === email);
  if (u) u.password = password;
  delete resets[token];
  await setJSON(USERS_KEY, list);
  await setJSON(RESETS_KEY, resets);
  return { ok: true };
}

// Google: stub. Real version = Google sign-in token sent to Laravel.
export async function googleSignIn() {
  await wait();
  return { ok: true, linked: true, user: { email: 'alexreyes@gmail.com' }, token: 'mock-google-token' };
}

export const setToken = () => {};
export const me = async () => ({ ok: true });
export const logout = async () => ({ ok: true });
