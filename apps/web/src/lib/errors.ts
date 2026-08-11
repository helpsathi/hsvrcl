/**
 * Translates low-level database (Prisma / PostgreSQL / Neon) errors into clean, 
 * human-readable and actionable messages for clients and administrators.
 */
export function formatDatabaseError(error: any, defaultFallback = "An unexpected error occurred. Please try again."): string {
  if (!error) return defaultFallback;

  const message = typeof error === "string" ? error : error?.message || "";
  const code = error?.code || "";

  // 1. Transaction Timeouts & Expired Transactions (Common during Neon serverless cold starts)
  if (
    message.includes("Transaction API error") ||
    message.includes("expired transaction") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("Transaction already closed")
  ) {
    return "The database server was warming up and took longer than expected. Please try again.";
  }

  // 2. Database Connection & Unreachable Host
  if (
    code === "P1001" ||
    code === "P1008" ||
    message.includes("Can't reach database") ||
    message.includes("Connection terminated") ||
    message.includes("connection closed") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNREFUSED")
  ) {
    return "Database connection is temporarily busy or reconnecting. Please wait a few seconds and try again.";
  }

  // 3. Unique Constraint Violations (Duplicate email, username, etc.)
  if (code === "P2002" || message.includes("Unique constraint failed")) {
    const target = error?.meta?.target;
    const field = Array.isArray(target) ? target.join(", ") : target || "field";
    return `A record with this ${field} already exists in the system.`;
  }

  // 4. Record Not Found / Foreign Key Constraint
  if (code === "P2025" || message.includes("Record to update not found") || message.includes("An operation failed because it depends on one or more records")) {
    return "The requested record was not found or has dependent references.";
  }

  if (code === "P2003" || message.includes("Foreign key constraint failed")) {
    return "Cannot complete action because related records exist or are missing.";
  }

  // 5. If it's already a clean user-facing error message (short, doesn't contain stack trace keywords)
  if (
    message &&
    !message.includes("PrismaClient") &&
    !message.includes("at ") &&
    !message.includes("{\n") &&
    !message.includes("Invocation:") &&
    message.length < 150
  ) {
    return message;
  }

  return defaultFallback;
}
