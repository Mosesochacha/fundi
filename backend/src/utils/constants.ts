// JWT_SECRET must be set in environment variables - no fallback for security
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

// Normalize JWT_ACCESS_EXPIRES - remove quotes if present and ensure valid format
const normalizeExpiresIn = (value: string | undefined): string | number => {
  if (!value) return 10; // default to 10 seconds as number
  // Remove surrounding quotes if present
  const cleaned = value.trim().replace(/^["']|["']$/g, '');
  // If it's a number, return as number
  if (/^\d+$/.test(cleaned)) {
    return parseInt(cleaned, 10);
  }
  // Convert "10s" to number (10 seconds)
  if (/^(\d+)s$/i.test(cleaned)) {
    return parseInt(cleaned.match(/^(\d+)s$/i)![1], 10);
  }
  // Otherwise return the string (should be like "1d", "20h", "10 seconds", etc.)
  return cleaned;
};

export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_EXPIRES: normalizeExpiresIn(process.env.JWT_ACCESS_EXPIRES) || 10,
  REFRESH_EXPIRES_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || "30", 10),
};

// Grace window during which a just-rotated refresh token may be reused without
// failing — tolerates concurrent/duplicate refresh calls (multiple tabs, retries).
export const REFRESH_GRACE_MS = 60_000;

export const USER_ROLES = {
  FAN: "fan",
  CREATOR: "creator", 
  ADMIN: "admin",
} as const;

export const USERNAME_CONFIG = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  REGEX: /^[a-zA-Z0-9._-]{3,20}$/,
  BLOCKED_USERNAMES: [
    "admin", "support", "jivunie", "api", "www", "mail", 
    "email", "info", "contact", "help", "test", "user",
    "creator", "about", "terms", "privacy", "policy",
    "legal", "blog", "news", "press", "media", "team",
    "careers", "jobs"
  ],
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
} as const;

/**
 * Custom Application Status Codes (similar to Safaricom's approach)
 * These codes provide more specific error information than standard HTTP codes
 * 
 * Code ranges:
 * - 3000-3099: Authentication & Authorization errors
 * - 3100-3199: User & Profile errors
 * - 3200-3299: Onboarding & Registration errors
 * - 3300-3399: Application & Opportunity errors
 * - 3400-3499: Validation errors
 * - 3500-3599: Business logic errors
 * - 3600-3699: Data & Resource errors
 * - 3700-3799: Payment & Transaction errors (if needed)
 * - 3800-3899: External service errors
 * - 3900-3999: System & Configuration errors
 */
export const CUSTOM_STATUS_CODES = {
  // Authentication & Authorization (3000-3099)
  AUTH_TOKEN_EXPIRED: 3000,
  AUTH_TOKEN_INVALID: 3001,
  AUTH_REFRESH_TOKEN_INVALID: 3002,
  AUTH_INSUFFICIENT_PERMISSIONS: 3003,
  AUTH_ACCOUNT_DEACTIVATED: 3004,
  AUTH_ACCOUNT_SUSPENDED: 3005,
  AUTH_EMAIL_NOT_VERIFIED: 3006,
  AUTH_OTP_EXPIRED: 3007,
  AUTH_OTP_INVALID: 3008,
  AUTH_RATE_LIMIT_EXCEEDED: 3009,

  // User & Profile (3100-3199)
  USER_NOT_FOUND: 3100,
  USER_ALREADY_EXISTS: 3101,
  USER_PROFILE_INCOMPLETE: 3102,
  USER_AGE_BELOW_MINIMUM: 3103,
  USER_PARENTAL_CONSENT_REQUIRED: 3104,
  USER_EMAIL_ALREADY_VERIFIED: 3105,
  USER_DISPLAY_NAME_INVALID: 3106,
  USER_PROFILE_UPDATE_FAILED: 3107,

  // Onboarding & Registration (3200-3299)
  ONBOARDING_NOT_COMPLETED: 3200,
  ONBOARDING_ALREADY_COMPLETED: 3201,
  ONBOARDING_REQUIRED_FIELDS_MISSING: 3202,
  ONBOARDING_AGE_VALIDATION_FAILED: 3203,
  ONBOARDING_PARENTAL_CONSENT_MISSING: 3204,
  ONBOARDING_INVALID_STEP: 3205,
  ONBOARDING_PROFILE_DATA_INVALID: 3206,

  // Application & Opportunity (3300-3399)
  APPLICATION_NOT_FOUND: 3300,
  APPLICATION_ALREADY_EXISTS: 3301,
  APPLICATION_DEADLINE_PASSED: 3302,
  APPLICATION_NOT_STARTED: 3303,
  APPLICATION_ELIGIBILITY_CHECK_FAILED: 3304,
  APPLICATION_INCOMPLETE: 3305,
  APPLICATION_WITHDRAWN: 3306,
  OPPORTUNITY_NOT_FOUND: 3350,
  OPPORTUNITY_NOT_ACTIVE: 3351,
  OPPORTUNITY_ALREADY_APPLIED: 3352,
  OPPORTUNITY_ELIGIBILITY_REQUIREMENTS_NOT_MET: 3353,

  // Validation errors (3400-3499)
  VALIDATION_REQUIRED_FIELD_MISSING: 3400,
  VALIDATION_INVALID_EMAIL_FORMAT: 3401,
  VALIDATION_INVALID_PASSWORD_FORMAT: 3402,
  VALIDATION_INVALID_DATE_FORMAT: 3403,
  VALIDATION_INVALID_PHONE_FORMAT: 3404,
  VALIDATION_INVALID_URL_FORMAT: 3405,
  VALIDATION_FIELD_TOO_LONG: 3406,
  VALIDATION_FIELD_TOO_SHORT: 3407,
  VALIDATION_INVALID_CHOICE: 3408,

  // Business logic errors (3500-3599)
  BUSINESS_RULE_VIOLATION: 3500,
  BUSINESS_OPERATION_NOT_ALLOWED: 3501,
  BUSINESS_QUOTA_EXCEEDED: 3502,
  BUSINESS_TIME_LIMIT_EXCEEDED: 3503,
  BUSINESS_DEPENDENCY_NOT_MET: 3504,

  // Data & Resource errors (3600-3699)
  RESOURCE_NOT_FOUND: 3600,
  RESOURCE_ALREADY_EXISTS: 3601,
  RESOURCE_CONFLICT: 3602,
  RESOURCE_LOCKED: 3603,
  RESOURCE_DELETED: 3604,
  DATA_INTEGRITY_ERROR: 3650,
  DATA_VALIDATION_ERROR: 3651,

  // External service errors (3800-3899)
  EXTERNAL_SERVICE_UNAVAILABLE: 3800,
  EXTERNAL_SERVICE_TIMEOUT: 3801,
  EXTERNAL_SERVICE_ERROR: 3802,
  EXTERNAL_API_RATE_LIMIT: 3803,

  // System & Configuration errors (3900-3999)
  SYSTEM_ERROR: 3900,
  SYSTEM_CONFIGURATION_ERROR: 3901,
  SYSTEM_MAINTENANCE_MODE: 3902,
  SYSTEM_FEATURE_DISABLED: 3903,
} as const;

/**
 * Custom status code messages mapping
 */
export const CUSTOM_STATUS_MESSAGES: Record<number, string> = {
  // Authentication & Authorization
  [CUSTOM_STATUS_CODES.AUTH_TOKEN_EXPIRED]: "Authentication token has expired",
  [CUSTOM_STATUS_CODES.AUTH_TOKEN_INVALID]: "Invalid authentication token",
  [CUSTOM_STATUS_CODES.AUTH_REFRESH_TOKEN_INVALID]: "Invalid refresh token",
  [CUSTOM_STATUS_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: "Insufficient permissions to perform this action",
  [CUSTOM_STATUS_CODES.AUTH_ACCOUNT_DEACTIVATED]: "Your account has been deactivated",
  [CUSTOM_STATUS_CODES.AUTH_ACCOUNT_SUSPENDED]: "Your account has been suspended",
  [CUSTOM_STATUS_CODES.AUTH_EMAIL_NOT_VERIFIED]: "Please verify your email address",
  [CUSTOM_STATUS_CODES.AUTH_OTP_EXPIRED]: "Verification code has expired",
  [CUSTOM_STATUS_CODES.AUTH_OTP_INVALID]: "Invalid verification code",
  [CUSTOM_STATUS_CODES.AUTH_RATE_LIMIT_EXCEEDED]: "Too many requests. Please try again later",

  // User & Profile
  [CUSTOM_STATUS_CODES.USER_NOT_FOUND]: "User not found",
  [CUSTOM_STATUS_CODES.USER_ALREADY_EXISTS]: "User already exists",
  [CUSTOM_STATUS_CODES.USER_PROFILE_INCOMPLETE]: "User profile is incomplete",
  [CUSTOM_STATUS_CODES.USER_AGE_BELOW_MINIMUM]: "You must be at least 13 years old to register",
  [CUSTOM_STATUS_CODES.USER_PARENTAL_CONSENT_REQUIRED]: "Parental or guardian consent is required for users aged 13-15",
  [CUSTOM_STATUS_CODES.USER_EMAIL_ALREADY_VERIFIED]: "Email is already verified",
  [CUSTOM_STATUS_CODES.USER_DISPLAY_NAME_INVALID]: "Invalid display name format",
  [CUSTOM_STATUS_CODES.USER_PROFILE_UPDATE_FAILED]: "Failed to update user profile",

  // Onboarding & Registration
  [CUSTOM_STATUS_CODES.ONBOARDING_NOT_COMPLETED]: "You must complete your profile onboarding before performing this action",
  [CUSTOM_STATUS_CODES.ONBOARDING_ALREADY_COMPLETED]: "Onboarding has already been completed",
  [CUSTOM_STATUS_CODES.ONBOARDING_REQUIRED_FIELDS_MISSING]: "Please complete all required fields",
  [CUSTOM_STATUS_CODES.ONBOARDING_AGE_VALIDATION_FAILED]: "Age validation failed. You must be at least 13 years old",
  [CUSTOM_STATUS_CODES.ONBOARDING_PARENTAL_CONSENT_MISSING]: "Parental consent is required for users aged 13-15",
  [CUSTOM_STATUS_CODES.ONBOARDING_INVALID_STEP]: "Invalid onboarding step",
  [CUSTOM_STATUS_CODES.ONBOARDING_PROFILE_DATA_INVALID]: "Invalid profile data provided",

  // Application & Opportunity
  [CUSTOM_STATUS_CODES.APPLICATION_NOT_FOUND]: "Application not found",
  [CUSTOM_STATUS_CODES.APPLICATION_ALREADY_EXISTS]: "You have already applied to this opportunity",
  [CUSTOM_STATUS_CODES.APPLICATION_DEADLINE_PASSED]: "The application deadline has passed",
  [CUSTOM_STATUS_CODES.APPLICATION_NOT_STARTED]: "Application period has not started yet",
  [CUSTOM_STATUS_CODES.APPLICATION_ELIGIBILITY_CHECK_FAILED]: "You do not meet the eligibility requirements",
  [CUSTOM_STATUS_CODES.APPLICATION_INCOMPLETE]: "Application is incomplete",
  [CUSTOM_STATUS_CODES.APPLICATION_WITHDRAWN]: "Application has been withdrawn",
  [CUSTOM_STATUS_CODES.OPPORTUNITY_NOT_FOUND]: "Opportunity not found",
  [CUSTOM_STATUS_CODES.OPPORTUNITY_NOT_ACTIVE]: "This opportunity is not currently accepting applications",
  [CUSTOM_STATUS_CODES.OPPORTUNITY_ALREADY_APPLIED]: "You have already applied to this opportunity",
  [CUSTOM_STATUS_CODES.OPPORTUNITY_ELIGIBILITY_REQUIREMENTS_NOT_MET]: "You do not meet the eligibility requirements for this opportunity",

  // Validation errors
  [CUSTOM_STATUS_CODES.VALIDATION_REQUIRED_FIELD_MISSING]: "Required field is missing",
  [CUSTOM_STATUS_CODES.VALIDATION_INVALID_EMAIL_FORMAT]: "Invalid email format",
  [CUSTOM_STATUS_CODES.VALIDATION_INVALID_PASSWORD_FORMAT]: "Password does not meet requirements",
  [CUSTOM_STATUS_CODES.VALIDATION_INVALID_DATE_FORMAT]: "Invalid date format",
  [CUSTOM_STATUS_CODES.VALIDATION_INVALID_PHONE_FORMAT]: "Invalid phone number format",
  [CUSTOM_STATUS_CODES.VALIDATION_INVALID_URL_FORMAT]: "Invalid URL format",
  [CUSTOM_STATUS_CODES.VALIDATION_FIELD_TOO_LONG]: "Field value is too long",
  [CUSTOM_STATUS_CODES.VALIDATION_FIELD_TOO_SHORT]: "Field value is too short",
  [CUSTOM_STATUS_CODES.VALIDATION_INVALID_CHOICE]: "Invalid choice selected",

  // Business logic errors
  [CUSTOM_STATUS_CODES.BUSINESS_RULE_VIOLATION]: "This action violates business rules",
  [CUSTOM_STATUS_CODES.BUSINESS_OPERATION_NOT_ALLOWED]: "This operation is not allowed",
  [CUSTOM_STATUS_CODES.BUSINESS_QUOTA_EXCEEDED]: "Quota exceeded for this operation",
  [CUSTOM_STATUS_CODES.BUSINESS_TIME_LIMIT_EXCEEDED]: "Time limit exceeded for this operation",
  [CUSTOM_STATUS_CODES.BUSINESS_DEPENDENCY_NOT_MET]: "Required dependencies are not met",

  // Data & Resource errors
  [CUSTOM_STATUS_CODES.RESOURCE_NOT_FOUND]: "Resource not found",
  [CUSTOM_STATUS_CODES.RESOURCE_ALREADY_EXISTS]: "Resource already exists",
  [CUSTOM_STATUS_CODES.RESOURCE_CONFLICT]: "Resource conflict occurred",
  [CUSTOM_STATUS_CODES.RESOURCE_LOCKED]: "Resource is locked",
  [CUSTOM_STATUS_CODES.RESOURCE_DELETED]: "Resource has been deleted",
  [CUSTOM_STATUS_CODES.DATA_INTEGRITY_ERROR]: "Data integrity error occurred",
  [CUSTOM_STATUS_CODES.DATA_VALIDATION_ERROR]: "Data validation error occurred",

  // External service errors
  [CUSTOM_STATUS_CODES.EXTERNAL_SERVICE_UNAVAILABLE]: "External service is unavailable",
  [CUSTOM_STATUS_CODES.EXTERNAL_SERVICE_TIMEOUT]: "External service request timed out",
  [CUSTOM_STATUS_CODES.EXTERNAL_SERVICE_ERROR]: "External service error occurred",
  [CUSTOM_STATUS_CODES.EXTERNAL_API_RATE_LIMIT]: "External API rate limit exceeded",

  // System & Configuration errors
  [CUSTOM_STATUS_CODES.SYSTEM_ERROR]: "System error occurred",
  [CUSTOM_STATUS_CODES.SYSTEM_CONFIGURATION_ERROR]: "System configuration error",
  [CUSTOM_STATUS_CODES.SYSTEM_MAINTENANCE_MODE]: "System is under maintenance",
  [CUSTOM_STATUS_CODES.SYSTEM_FEATURE_DISABLED]: "This feature is currently disabled",
};

/**
 * Per-user currency preference. Stored as a 3-letter ISO-ish code on the user
 * record. Keep this in sync with the client's currency picker.
 */
export const ALLOWED_CURRENCIES = [
  "USD", "EUR", "GBP", "KES", "NGN", "GHS",
  "ZAR", "UGX", "TZS", "INR", "AED", "CAD",
] as const;

export type CurrencyCode = (typeof ALLOWED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

/** Normalise + validate a currency code; returns null when not allowed. */
export const normalizeCurrency = (value: unknown): CurrencyCode | null => {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return (ALLOWED_CURRENCIES as readonly string[]).includes(code)
    ? (code as CurrencyCode)
    : null;
};

export const RESPONSE_MESSAGES = {
  SUCCESS: "Operation successful",
  USER_CREATED: "User registered successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logged out successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  INVALID_CREDENTIALS: "Invalid credentials",
  USER_NOT_FOUND: "User not found",
  EMAIL_EXISTS: "Email already in use",
  USERNAME_EXISTS: "Username is already taken",
  USERNAME_INVALID: "Invalid username format",
  USERNAME_BLOCKED: "Username not allowed",
  MISSING_FIELDS: "Missing required fields",
  SERVER_ERROR: "Internal server error",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden: insufficient permissions",
} as const;