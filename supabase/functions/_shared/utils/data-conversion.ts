/**
 * Safe data conversion utilities for RSS feed processing
 * Shared across multiple edge functions
 */

/**
 * Safely convert any value to string with proper null/undefined handling
 * @param value - Any value to convert to string
 * @returns Safe string representation
 */
export function safeToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Object]";
    }
  }

  return String(value);
}

/**
 * Safely extract text content from HTML or encoded content
 * @param content - Raw content that might contain HTML
 * @returns Clean text content
 */
export function safeExtractText(content: unknown): string {
  const text = safeToString(content);

  // Basic HTML tag removal (for RSS content that might contain HTML)
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Safely parse date from various RSS date formats
 * @param dateValue - Date value from RSS feed
 * @returns ISO string or empty string if invalid
 */
export function safeParseDateToISO(dateValue: unknown): string {
  const dateStr = safeToString(dateValue);

  if (!dateStr) return "";

  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "" : date.toISOString();
  } catch {
    return "";
  }
}
