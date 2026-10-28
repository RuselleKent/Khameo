// Mga setting ng app. Isang lugar lang para sa lahat.

// --- Code verification ---
export const CODE_LENGTH = 6; // ilang digits ang code
export const RESEND_SECONDS = 59; // hintay bago makapag-resend
export const MAX_CODE_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 5;

// --- Backend (Laravel sa Render) ---
// Ilagay dito ang URL ng Render service mo + "/api".
// Hindi na kailangang palit-palitan ang IP kasi online na ang backend.
export const PRODUCTION_API_URL = 'https://khameo-api.onrender.com/api';

// Gusto mo bang subukan ang ibang backend (hal. local)? Gumawa ng file na ".env" sa Front-end
// folder at ilagay: EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api
// Kapag walang ".env", PRODUCTION_API_URL ang gagamitin.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;

// Gaano katagal maghihintay sa server bago sumuko (milliseconds).
// 60 seconds, kasi ang free Render ay natutulog at ~1 minute bago magising.
export const REQUEST_TIMEOUT_MS = 60000;
