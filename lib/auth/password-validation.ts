/**
 * Client-side password validation utilities
 * Mirrors the server-side validation logic for immediate feedback
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
}

const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '123456789', 'qwerty',
  'abc123', 'password1', 'admin', 'letmein', 'welcome', '111111',
  'sunshine', 'princess', 'azerty', '123123', 'batman', 'superman',
  'login', 'passw0rd', 'master', 'hello', 'charlie', 'aa123456',
  'donald', 'password1234', 'qwerty123'
];

/**
 * Validate password strength on the client side
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check maximum length
  if (password.length > 128) {
    errors.push('Password must be no more than 128 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a more secure password');
  }

  // Calculate score if no errors
  if (errors.length === 0) {
    // Base score for meeting requirements
    score = 60;

    // Bonus for length
    if (password.length >= 12) {
      score += 10;
    } else if (password.length >= 10) {
      score += 5;
    }

    // Bonus for special characters
    if (/[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\?]/.test(password)) {
      score += 10;
    }

    // Bonus for mixed case and numbers
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
      score += 10;
    }

    // Bonus for no repeated characters (3+ in a row)
    if (!/(.)\1{2,}/.test(password)) {
      score += 10;
    }

    // Cap at 100
    score = Math.min(score, 100);
  }

  // Determine strength level
  let strength: PasswordValidationResult['strength'] = 'weak';
  if (errors.length === 0) {
    if (score >= 90) strength = 'excellent';
    else if (score >= 80) strength = 'strong';
    else if (score >= 70) strength = 'good';
    else if (score >= 60) strength = 'fair';
  }

  return {
    valid: errors.length === 0,
    errors,
    score,
    strength
  };
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'excellent': return 'text-green-600';
    case 'strong': return 'text-green-500';
    case 'good': return 'text-yellow-500';
    case 'fair': return 'text-orange-500';
    case 'weak': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

/**
 * Get password strength background color for progress bar
 */
export function getPasswordStrengthBgColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'excellent': return 'bg-green-600';
    case 'strong': return 'bg-green-500';
    case 'good': return 'bg-yellow-500';
    case 'fair': return 'bg-orange-500';
    case 'weak': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
}

/**
 * Generate password suggestions
 */
export function generatePasswordSuggestions(): string[] {
  const adjectives = ['Secure', 'Strong', 'Mighty', 'Swift', 'Bright', 'Smart', 'Quick', 'Bold'];
  const nouns = ['Tiger', 'Eagle', 'Storm', 'River', 'Mountain', 'Ocean', 'Forest', 'Star'];
  const symbols = ['!', '@', '#', '$', '%', '&', '*'];
  
  const suggestions: string[] = [];
  
  for (let i = 0; i < 3; i++) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 100;
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    suggestions.push(`${adjective}${noun}${number}${symbol}`);
  }
  
  return suggestions;
}

/**
 * Check if password has been compromised (placeholder for future implementation)
 * In production, this could integrate with HaveIBeenPwned API
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  // Placeholder - in production, you might want to integrate with HaveIBeenPwned
  // For now, just check against our common passwords list
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}

/**
 * Password requirements for display in UI
 */
export const PASSWORD_REQUIREMENTS = [
  'At least 8 characters long',
  'Contains uppercase letter (A-Z)',
  'Contains lowercase letter (a-z)',
  'Contains number (0-9)',
  'Contains special character (!@#$%^&*)',
  'Not a common password'
];

/**
 * Check which requirements are met
 */
export function getPasswordRequirementStatus(password: string): Record<string, boolean> {
  return {
    'length': password.length >= 8,
    'uppercase': /[A-Z]/.test(password),
    'lowercase': /[a-z]/.test(password),
    'number': /[0-9]/.test(password),
    'special': /[^A-Za-z0-9]/.test(password),
    'notCommon': !COMMON_PASSWORDS.includes(password.toLowerCase())
  };
}

/**
 * Real-time password validation hook for React components
 */
export function usePasswordValidation(password: string) {
  const validation = validatePasswordStrength(password);
  const requirements = getPasswordRequirementStatus(password);
  
  return {
    ...validation,
    requirements,
    color: getPasswordStrengthColor(validation.strength),
    bgColor: getPasswordStrengthBgColor(validation.strength)
  };
}
