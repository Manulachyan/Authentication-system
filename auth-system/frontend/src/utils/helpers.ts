export const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

export const getInitials = (name: string) => {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLong = password.length >= 12;
  const score = [hasUpper, hasLower, hasNumber, hasSpecial, isLong].filter(Boolean).length;

  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
  if (score <= 3) return { label: 'Medium', color: 'bg-yellow-500', width: 'w-2/3' };
  return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
    case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    case 'suspicious': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
    default: return 'text-gray-600 bg-gray-50';
  }
}; 