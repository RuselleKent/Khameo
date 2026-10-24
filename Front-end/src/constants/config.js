// Change these in one place.
export const CODE_LENGTH = 6;
export const RESEND_SECONDS = 59;
export const MAX_CODE_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 5;

// ---- Backend (Laravel) ----
// Phone/emulator cannot use "localhost" for your computer:
//   Android emulator -> http://10.0.2.2:8000/api
//   Real phone       -> http://YOUR-PC-IP:8000/api   (same Wi-Fi)
// Put it in a .env file in the project root:  EXPO_PUBLIC_API_URL=http://192.168.1.5:8000/api
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
// EXPO_PUBLIC_USE_MOCK=true  -> use the fake backend (no server needed)
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
