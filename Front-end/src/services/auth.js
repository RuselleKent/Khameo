// Ito ang tinatawag ng mga screen para makipag-usap sa Laravel API.
// Bawat function ay sumasagot ng { ok: true, ... } kapag success,
// o { ok: false, field?, message, ... } kapag may mali.
// Walang login logic dito. Si Laravel ang nagche-check ng password, code, at iba pa.
import { API_URL, REQUEST_TIMEOUT_MS } from '../constants/config';

// Ang token ay nasa memory lang dito. Ang pag-save sa phone ay ginagawa ng AuthContext.
let token = null;
export const setToken = (newToken) => {
    token = newToken;
};

// Gisingin ang server (ang free Render ay natutulog kapag walang gumagamit).
// Tinatawag ito pagbukas ng app para gising na siya pagdating sa login screen.
export function wakeServer() {
    const root = API_URL.replace(/\/api\/?$/, '');
    fetch(root + '/up').catch(() => {});
}

// Pangkalahatang function sa pagtawag ng API
async function request(path, { method = 'POST', body } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res;
    try {
        res = await fetch(API_URL + path, {
            method,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (error) {
        const timedOut = error?.name === 'AbortError';
        return {
            ok: false,
            network: true,
            message: timedOut
                ? 'The server is waking up. Please wait a moment and try again.'
                : 'Cannot reach the server. Check your internet connection.',
        };
    } finally {
        clearTimeout(timer);
    }

    // Basahin ang sagot ng Laravel (JSON)
    let data = {};
    try {
        data = await res.json();
    } catch {
        // Hindi JSON ang sagot, gagamitin ang default na message sa baba
    }

    if (res.ok) {
        return { ok: true, ...data };
    }

    // Laravel validation errors: { errors: { email: ["..."] } }
    // Kukunin natin ang unang field para ipakita sa ilalim ng tamang input.
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

// Sinasabi ng Laravel na "Password must match." sa password field.
// Sa screen, sa ilalim ng Confirm Password natin ito ipapakita.
const moveToConfirmField = (result) =>
    result.message === 'Password must match.' ? { ...result, field: 'confirm' } : result;

export async function login({ email, password, remember }) {
    const result = await request('/login', { body: { email, password, remember: !!remember } });

    // Tama ang password pero hindi pa verified ang email
    if (result.status === 403 && result.needs_verification) {
        return { ok: false, needsVerification: true, email: result.email, message: result.message };
    }
    return result;
}

export async function register({ email, password, confirm }) {
    const result = await request('/register', {
        body: { email, password, password_confirmation: confirm },
    });
    return moveToConfirmField(result);
}

export async function verifyCode({ email, code }) {
    const result = await request('/verify-code', { body: { email, code } });

    // 429 = na-lock dahil sa maraming maling code
    if (result.status === 429) {
        return { ...result, locked: true, lockedUntil: result.locked_until };
    }
    return result;
}

export const resendCode = ({ email }) => request('/resend-code', { body: { email } });

export const forgotPassword = ({ email }) => request('/forgot-password', { body: { email } });

export async function resetPassword({ token: resetToken, email, password, confirm }) {
    const result = await request('/reset-password', {
        body: { token: resetToken, email, password, password_confirmation: confirm },
    });
    return moveToConfirmField(result);
}

// TODO: Kailangan pa ng Google client IDs at expo-auth-session.
// Pagkatapos, ipapadala ang id_token sa POST /auth/google (ready na ang Laravel).
export async function googleSignIn() {
    return { ok: false, message: 'Google sign-in is not set up yet.' };
}

export const me = () => request('/me', { method: 'GET' });
export const logout = () => request('/logout');
