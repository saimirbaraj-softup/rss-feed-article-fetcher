// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import type { ArticleFetchRequest } from "./types/request.ts";
import {
  createErrorResponse,
  createValidationErrorResponse,
} from "../_shared/utils/response-helpers.ts";
import { handleArticleFetch } from "./handlers/article-fetch-handler.ts";

console.info("Article Fetcher server started");

/**
 * Validate the incoming request payload
 */
function validateRequest(
  requestBody: unknown
): requestBody is ArticleFetchRequest {
  if (!requestBody || typeof requestBody !== "object") {
    return false;
  }

  const { sourceBatch } = requestBody as any;

  return !!(
    sourceBatch &&
    sourceBatch.sources &&
    Array.isArray(sourceBatch.sources) &&
    sourceBatch.batchId &&
    sourceBatch.topicName
  );
}

/**
 * Main Deno serve handler - clean and focused
 */
Deno.serve(async (req: Request): Promise<Response> => {
  try {
    // Parse request body
    const requestBody = await req.json();

    // Validate request
    if (!validateRequest(requestBody)) {
      return createValidationErrorResponse(
        "Invalid sourceBatch object or required fields missing"
      );
    }

    // Process the request
    const result = await handleArticleFetch(requestBody.sourceBatch);

    // Return success response
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in article-fetcher:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return createErrorResponse(errorMessage, 500);
  }
});
