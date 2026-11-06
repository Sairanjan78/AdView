/**
 * Rough password strength for the hint under "New password".
 * The server only enforces 8+ characters; this nudges people towards longer, mixed passwords.
 * Returns { score: 0-4, label, hint }.
 */
export const MIN_PASSWORD_LENGTH = 8;

export function passwordStrength(password = '') {
  if (!password) return { score: 0, label: '', hint: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { score: 0, label: 'Too short', hint: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  let points = 0;
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  if (/^(.)\1+$/.test(password) || /^(password|12345678|qwerty)/i.test(password)) points = 0;

  if (points <= 1) return { score: 1, label: 'Weak', hint: 'Add more characters, numbers or symbols.' };
  if (points === 2) return { score: 2, label: 'Fair', hint: 'Mixing upper and lower case, numbers and symbols helps.' };
  if (points === 3) return { score: 3, label: 'Good', hint: 'A few more characters would make it even stronger.' };
  return { score: 4, label: 'Strong', hint: 'Great password.' };
}
