/**
 * Smart URL validation and normalization utilities
 * Handles partial domains and auto-adds protocols when needed
 * HTTPS-only for security
 */

/**
 * Options for URL validation and normalization
 */
export interface UrlValidationOptions {
  /** Whether to auto-add https:// protocol if missing */
  addProtocol?: boolean;
  /** Whether to auto-add www. subdomain if missing */
  addWww?: boolean;
  /** List of allowed protocols (default: ['https:']) */
  allowedProtocols?: string[];
  /** Whether to allow URLs without TLD (for development) */
  allowLocalhost?: boolean;
  /** Whether to return the normalized URL instead of just validating */
  normalize?: boolean;
}

/**
 * Result of URL validation/normalization
 */
export interface UrlValidationResult {
  /** Whether the URL is valid */
  isValid: boolean;
  /** The original URL provided */
  originalUrl: string;
  /** The normalized/corrected URL */
  normalizedUrl: string;
  /** Error message if validation failed */
  error?: string;
  /** What corrections were made */
  corrections: string[];
}

/**
 * Smart URL validator that handles partial domains and auto-correction
 * HTTPS-only for security
 * 
 * Examples:
 * - "meetball.fun" → "https://www.meetball.fun" 
 * - "www.meetball.fun" → "https://www.meetball.fun"
 * - "http://meetball.fun" → Invalid (only HTTPS allowed)
 * - "meetball" → Invalid (no TLD)
 */
export function validateAndNormalizeUrl(
  url: string, 
  options: UrlValidationOptions = {}
): UrlValidationResult {
  const {
    addProtocol = true,
    addWww = true,
    allowedProtocols = ['https:'], // HTTPS-only by default
    allowLocalhost = true,
    normalize = true
  } = options;

  const originalUrl = url.trim();
  let normalizedUrl = originalUrl;
  const corrections: string[] = [];

  // Handle empty URLs
  if (!originalUrl) {
    return {
      isValid: false,
      originalUrl,
      normalizedUrl: '',
      error: 'URL cannot be empty',
      corrections: []
    };
  }

  try {
    // Try to parse as-is first
    let urlObj: URL;
    let needsProtocol = false;

    try {
      urlObj = new URL(normalizedUrl);
    } catch {
      // If parsing fails, try adding protocol
      if (addProtocol && !normalizedUrl.includes('://')) {
        normalizedUrl = `https://${normalizedUrl}`;
        corrections.push('Added https:// protocol');
        needsProtocol = true;
        
        try {
          urlObj = new URL(normalizedUrl);
        } catch {
          return {
            isValid: false,
            originalUrl,
            normalizedUrl,
            error: 'Invalid URL format',
            corrections
          };
        }
      } else {
        return {
          isValid: false,
          originalUrl,
          normalizedUrl,
          error: 'Invalid URL format',
          corrections
        };
      }
    }

    // Check if protocol is allowed (HTTPS-only by default)
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return {
        isValid: false,
        originalUrl,
        normalizedUrl,
        error: `Only HTTPS URLs are allowed. Use https:// instead of ${urlObj.protocol}`,
        corrections
      };
    }

    // Handle localhost/development URLs
    const isLocalhost = urlObj.hostname === 'localhost' || 
                        urlObj.hostname.startsWith('127.') ||
                        urlObj.hostname.endsWith('.local');

    if (isLocalhost && !allowLocalhost) {
      return {
        isValid: false,
        originalUrl,
        normalizedUrl,
        error: 'Localhost URLs not allowed',
        corrections
      };
    }

    // Check for valid TLD (unless localhost)
    if (!isLocalhost) {
      const hasValidTld = urlObj.hostname.includes('.') && 
                          urlObj.hostname.split('.').length >= 2 &&
                          urlObj.hostname.split('.').pop()!.length >= 2;

      if (!hasValidTld) {
        return {
          isValid: false,
          originalUrl,
          normalizedUrl,
          error: 'URL must have a valid domain with TLD (e.g., .com, .fun)',
          corrections
        };
      }
    }

    // Auto-add www. if needed and requested
    if (addWww && !isLocalhost && needsProtocol) {
      const hostname = urlObj.hostname;
      
      // Only add www if:
      // 1. It doesn't already have www
      // 2. It's not a subdomain already
      // 3. It's a simple domain (domain.tld)
      const parts = hostname.split('.');
      const hasSubdomain = parts.length > 2;
      const hasWww = hostname.startsWith('www.');
      
      if (!hasWww && !hasSubdomain && parts.length === 2) {
        normalizedUrl = normalizedUrl.replace(hostname, `www.${hostname}`);
        corrections.push('Added www. subdomain');
        
        // Re-parse to validate
        urlObj = new URL(normalizedUrl);
      }
    }

    return {
      isValid: true,
      originalUrl,
      normalizedUrl: normalize ? normalizedUrl : originalUrl,
      corrections
    };

  } catch (error) {
    return {
      isValid: false,
      originalUrl,
      normalizedUrl,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      corrections
    };
  }
}

/**
 * Simple validation function for Zod schemas
 * Returns boolean for compatibility with Zod refine()
 * HTTPS-only by default
 */
export function isValidUrl(url: string, options?: UrlValidationOptions): boolean {
  if (!url || url.trim() === '') return true; // Allow empty URLs
  
  const result = validateAndNormalizeUrl(url, {
    addProtocol: true,
    addWww: true,
    allowedProtocols: ['https:'], // HTTPS-only
    ...options
  });
  return result.isValid;
}

/**
 * Normalize a URL with smart defaults for web URLs
 * Returns the normalized URL or the original if invalid
 * HTTPS-only by default
 */
export function normalizeWebUrl(url: string): string {
  if (!url || url.trim() === '') return url;
  
  const result = validateAndNormalizeUrl(url, {
    addProtocol: true,
    addWww: true,
    allowedProtocols: ['https:'], // HTTPS-only
    normalize: true
  });
  
  return result.isValid ? result.normalizedUrl : url;
}

/**
 * Get user-friendly error message for URL validation
 * Used for form validation feedback
 */
export function getUrlErrorMessage(url: string, options?: UrlValidationOptions): string | null {
  if (!url || url.trim() === '') return null;
  
  const result = validateAndNormalizeUrl(url, options);
  return result.isValid ? null : (result.error || 'Invalid URL');
}

/**
 * Examples and test cases for validation
 */
export const URL_VALIDATION_EXAMPLES = {
  valid: [
    'https://meetball.fun',
    'https://www.meetball.fun',
    'meetball.fun',
    'www.meetball.fun',
    'api.meetball.fun',
    'localhost:3000',
    'https://127.0.0.1:8080'
  ],
  invalid: [
    'meetball', // No TLD
    'just-text',
    'http://meetball.fun', // HTTP not allowed (HTTPS-only)
    '.com',
    'https://'
  ],
  normalized: {
    'meetball.fun': 'https://www.meetball.fun',
    'www.meetball.fun': 'https://www.meetball.fun',
    'api.meetball.fun': 'https://api.meetball.fun',
  }
};