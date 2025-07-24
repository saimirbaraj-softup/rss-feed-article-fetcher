/**
 * Shared response helper utilities for consistent API responses
 * across all edge functions
 */

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, status = 200): Response {
  const response: APIResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string, status = 500): Response {
  const response: APIResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  });
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(message: string): Response {
  return createErrorResponse(`Validation Error: ${message}`, 400);
}

/**
 * Standard response headers for all API endpoints
 */
export const STANDARD_HEADERS = {
  "Content-Type": "application/json",
  Connection: "keep-alive",
} as const;
