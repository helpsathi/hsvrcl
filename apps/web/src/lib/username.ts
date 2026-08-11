export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const RESERVED_USERNAMES = new Set([
  "admin", "api", "login", "signup", "support", "settings", 
  "mentor", "mentors", "dashboard", "help", "root", "auth", 
  "profile", "my-mentors", "onboarding", "proposals", "availability", 
  "wallet", "coupons", "community", "chats", "reviews", "scheduled-calls",
  "superadmin", "staff", "system", "moderated", "null", "undefined", "void",
  "test", "official", "moderator"
]);

export const FORBIDDEN_SUBSTRINGS = [
  "helpsathi",
  "official",
  "support",
  "admin",
  "moderated",
  "system",
  "staff"
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateUsernameSyntax(rawUsername?: string | null): ValidationResult {
  if (!rawUsername) {
    return { isValid: false, error: "Username is required" };
  }

  const trimmed = rawUsername.trim();
  if (trimmed.length < 3) {
    return { isValid: false, error: "Must be at least 3 characters" };
  }
  if (trimmed.length > 20) {
    return { isValid: false, error: "Maximum 20 characters allowed" };
  }

  const username = trimmed.toLowerCase();

  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, error: "Letters, numbers & underscores only" };
  }

  if (username.startsWith("_") || username.endsWith("_")) {
    return { isValid: false, error: "Cannot begin or end with an underscore" };
  }

  if (username.includes("__")) {
    return { isValid: false, error: "Cannot contain consecutive underscores" };
  }

  if (RESERVED_USERNAMES.has(username)) {
    return { isValid: false, error: "This username is reserved by the system" };
  }

  for (const substring of FORBIDDEN_SUBSTRINGS) {
    if (username.includes(substring)) {
      return { isValid: false, error: `Cannot contain reserved keyword '${substring}'` };
    }
  }

  return { isValid: true };
}
