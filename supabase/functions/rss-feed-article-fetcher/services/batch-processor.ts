/**
 * Batch processing service for RSS feeds
 * Handles processing multiple RSS sources in parallel batches
 */

import type {
  RSSSource,
  ProcessedRSSSource,
  BatchProcessingResult,
} from "../../_shared/types/rss.ts";
import { fetchRSSFeed } from "./rss-fetcher.ts";

/**
 * Process RSS sources in batches to avoid overwhelming servers
 * @param sources - Array of RSS sources to process
 * @param batchSize - Number of sources to process in parallel (default: 25)
 * @returns Processing results with timing information
 */
export async function processBatchSources(
  sources: RSSSource[],
  batchSize: number = 25
): Promise<BatchProcessingResult> {
  const startTime = Date.now();
  const results: ProcessedRSSSource[] = [];

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);

    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}, sources ${
        i + 1
      } to ${Math.min(i + batchSize, sources.length)}`
    );

    // Process current batch in parallel
    const batchPromises = batch.map((source) => fetchRSSFeed(source));
    const batchResults = await Promise.allSettled(batchPromises);

    // Handle results and rejections
    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        const reason = result.reason;
        const errorMessage =
          reason instanceof Error ? reason.message : "Unknown error occurred";

        console.error(`Failed to process source ${batch[index].name}:`, reason);

        results.push({
          ...batch[index],
          articles: [],
          error: errorMessage,
          lastFetched: new Date().toISOString(),
          success: false,
        });
      }
    });

    // Add a small delay between batches to avoid overwhelming servers
    if (i + batchSize < sources.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const endTime = Date.now();
  const processingTimeMs = endTime - startTime;

  // Separate successful and failed sources
  const successfulSources = results.filter((source) => source.success);
  const failedSources = results.filter((source) => !source.success);

  return {
    processedSources: results,
    successfulSources,
    failedSources,
    processingTimeMs,
  };
}
