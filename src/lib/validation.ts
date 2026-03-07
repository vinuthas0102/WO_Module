/**
 * Application-level validation utilities
 *
 * DEMO SECURITY NOTE:
 * These validation functions provide a basic safety layer for the demo environment.
 * They DO NOT replace proper database-level security (which is intentionally simplified for demo).
 *
 * For production:
 * - Implement comprehensive server-side validation
 * - Add database-level constraints and triggers
 * - Use parameterized queries exclusively
 * - Implement proper RLS policies with auth checks
 */

/**
 * Validates that a string does not contain SQL injection patterns
 * Note: This is a basic check only. Proper protection requires parameterized queries.
 */
export function containsSQLInjectionPattern(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const dangerousPatterns = [
    /(\b(DROP|DELETE|TRUNCATE|ALTER|CREATE)\b.*\b(TABLE|DATABASE|SCHEMA)\b)/i,
    /;\s*(DROP|DELETE|TRUNCATE)/i,
    /--\s*$/,
    /\/\*.*\*\//,
    /'.*OR.*'.*='.*'/i,
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /UNION.*SELECT/i,
    /EXEC(\s|\+)+(s|x)p\w+/i
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates that a string does not contain XSS patterns
 * Note: This is a basic check. Proper protection requires content security policies and sanitization.
 */
export function containsXSSPattern(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 * Note: This is basic sanitization. Use proper libraries for production.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 10000); // Limit length to prevent DoS
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validates that input is within reasonable length limits
 */
export function isWithinLengthLimit(input: string, maxLength: number = 1000): boolean {
  if (!input || typeof input !== 'string') return true;
  return input.length <= maxLength;
}

/**
 * Validates that a number is within a reasonable range
 */
export function isValidNumber(value: number, min: number = 0, max: number = 1000000): boolean {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Validates that a date is reasonable (not too far in past or future)
 */
export function isValidDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (!d || isNaN(d.getTime())) return false;

  const now = new Date();
  const minDate = new Date('1900-01-01');
  const maxDate = new Date(now.getFullYear() + 10, 11, 31);

  return d >= minDate && d <= maxDate;
}

/**
 * Validates file upload parameters
 */
export function isValidFileUpload(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size (max 50MB for demo)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  // Check file name for dangerous patterns
  if (containsSQLInjectionPattern(file.name) || containsXSSPattern(file.name)) {
    return { valid: false, error: 'Invalid file name' };
  }

  // Check file name length
  if (file.name.length > 255) {
    return { valid: false, error: 'File name too long' };
  }

  return { valid: true };
}

/**
 * Rate limiting tracker (in-memory, resets on page reload)
 * This is a basic client-side rate limiter for demo purposes only.
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if an action is allowed based on rate limits
   * @param key Identifier for the action (e.g., 'login', 'create-ticket')
   * @param maxRequests Maximum number of requests allowed
   * @param windowMs Time window in milliseconds
   */
  isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);

    // Check if limit exceeded
    if (recentTimestamps.length >= maxRequests) {
      return false;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.requests.set(key, recentTimestamps);

    return true;
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requests.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Validates that user has permission for an action (basic check)
 * Note: This is application-level only. Proper authorization requires database RLS.
 */
export function hasBasicPermission(userRole: string, action: string): boolean {
  // Very basic role-based checks
  const roleHierarchy: { [key: string]: number } = {
    'EO': 3,
    'DO': 2,
    'Finance': 2,
    'Employee': 1,
    'Vendor': 0
  };

  const actionRequirements: { [key: string]: number } = {
    'create-user': 3,
    'delete-user': 3,
    'edit-user': 3,
    'manage-fields': 3,
    'create-ticket': 1,
    'edit-ticket': 1,
    'delete-ticket': 2,
    'approve-finance': 2
  };

  const userLevel = roleHierarchy[userRole] ?? 0;
  const requiredLevel = actionRequirements[action] ?? 1;

  return userLevel >= requiredLevel;
}

/**
 * Demo security notice logger
 */
export function logSecurityNotice(action: string, details?: string): void {
  if (import.meta.env.DEV) {
    console.warn(
      `[DEMO SECURITY] Action: ${action}`,
      details ? `| Details: ${details}` : '',
      '| Note: This demo uses simplified security. See SECURITY.md'
    );
  }
}
