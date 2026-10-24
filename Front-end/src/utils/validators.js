const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
  const v = (value || '').trim();
  if (!v) return 'Email is required.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
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
