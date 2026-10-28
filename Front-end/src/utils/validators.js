// Mabilis na check sa phone bago tumawag sa server.
// Ibinabalik ang error message, o '' (walang laman) kapag okay.
// Ang totoong pag-check ay nasa Laravel pa rin.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
    const email = (value || '').trim();

    if (!email) return 'Email is required.';
    if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
    return '';
}

export function validatePassword(value) {
    if (!value) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    return '';
}

export function validateConfirm(password, confirm) {
    if (!confirm) return 'Please confirm your password.';
    if (password !== confirm) return 'Password must match.';
    return '';
}
