import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLong = password.length >= 12;

  const score = [hasUpper, hasLower, hasNumber, hasSpecial, isLong].filter(Boolean).length;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}; 