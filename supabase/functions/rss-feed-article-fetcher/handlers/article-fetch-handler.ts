/**
 * Main business logic handler for RSS article fetching
 * Orchestrates the entire article fetching and filtering process
 */

import type { EnrichedRSSArticle } from "../../_shared/types/rss.ts";
import type { SourceBatch } from "../types/request.ts";
import type {
  ArticleFetchResponse,
  BatchDetails,
  ProcessingStats,
  FailedSourceInfo,
} from "../types/response.ts";
import { processBatchSources } from "../services/batch-processor.ts";
import { NotKeywordFilter } from "../services/keyword-filter.ts";

/**
 * Enrich articles with additional metadata from source and topic information
 */
function enrichArticles(
  processedSources: any[],
  sourceBatch: SourceBatch
): EnrichedRSSArticle[] {
  const allArticles: EnrichedRSSArticle[] = [];

  processedSources.forEach((source) => {
    if (source.articles && source.articles.length > 0) {
      source.articles.forEach((article: any) => {
        allArticles.push({
          ...article,
          originalSourceId: source.id,
          originalSourceName: source.name,
          sourceId: source.id,
          sourceName: source.name,
          sourceScore: source.score,
          sourceRssFeedUrl: source.rssFeedUrl,
          sourceContentFetching: source.contentFetching || "SCRAPING",
          feedLanguage: source.feedLanguage || "",
          topicId: source.topicId || sourceBatch.topicId,
          topicName: source.topicName || sourceBatch.topicName,
        });
      });
    }
  });

  return allArticles;
}

/**
 * Create batch details for the response
 */
function createBatchDetails(
  sourceBatch: SourceBatch,
  processingTimeMs: number
): BatchDetails {
  return {
    batchId: sourceBatch.batchId,
    batchNumber: sourceBatch.batchNumber,
    totalBatches: sourceBatch.totalBatches,
    topicId: sourceBatch.topicId,
    topicName: sourceBatch.topicName,
    processedAt: new Date().toISOString(),
    processingTimeMs,
  };
}

/**
 * Create processing statistics for the response
 */
function createProcessingStats(
  processedSourcesCount: number,
  successfulSourcesCount: number,
  failedSourcesCount: number,
  totalArticlesFetched: number,
  totalArticlesAfterFiltering: number,
  totalArticlesDiscarded: number,
  filteringApplied: boolean
): ProcessingStats {
  return {
    totalSourcesProcessed: processedSourcesCount,
    successfulSources: successfulSourcesCount,
    failedSources: failedSourcesCount,
    totalArticlesFetched,
    totalArticlesAfterFiltering,
    totalArticlesDiscarded,
    filteringApplied,
  };
}

/**
 * Format failed sources for the response
 */
function formatFailedSources(failedSources: any[]): FailedSourceInfo[] {
  return failedSources.map((source) => ({
    id: source.id,
    name: source.name,
    url: source.url,
    rssFeedUrl: source.rssFeedUrl,
    error: source.error,
    success: false,
    lastFetched: source.lastFetched,
  }));
}

/**
 * Main article fetch handler that orchestrates the entire process
 */
export async function handleArticleFetch(
  sourceBatch: SourceBatch
): Promise<ArticleFetchResponse> {
  console.log(
    `Processing Topic: ${sourceBatch.topicName} - batch ${sourceBatch.batchId} with ${sourceBatch.sources.length} sources`
  );

  // Process sources in batches of 25
  const batchResult = await processBatchSources(sourceBatch.sources, 25);

  // Collect all articles from successful sources with enhanced metadata
  const allArticles = enrichArticles(
    batchResult.successfulSources,
    sourceBatch
  );

  // Apply NOT keyword filtering
  const filteringResult = NotKeywordFilter.filterOutNotKeywords(
    allArticles,
    sourceBatch.relationshipKeywords || []
  );

  // Calculate statistics
  const totalArticlesFetched = allArticles.length;
  const totalArticlesAfterFiltering = filteringResult.filteredArticles.length;
  const totalArticlesDiscarded =
    filteringResult.discardedArticlesResults.totalDiscarded;
  const filteringApplied = (sourceBatch.relationshipKeywords?.length || 0) > 0;

  // Create response data
  const response: ArticleFetchResponse = {
    success: true,
    batchDetails: createBatchDetails(sourceBatch, batchResult.processingTimeMs),
    processingStats: createProcessingStats(
      batchResult.processedSources.length,
      batchResult.successfulSources.length,
      batchResult.failedSources.length,
      totalArticlesFetched,
      totalArticlesAfterFiltering,
      totalArticlesDiscarded,
      filteringApplied
    ),
    failedSources: formatFailedSources(batchResult.failedSources),
    discardedArticlesResults: filteringResult.discardedArticlesResults,
    articles: filteringResult.filteredArticles,
    relationshipKeywords: sourceBatch.relationshipKeywords || [],
    topicKeywords: sourceBatch.keywords || [],
  };

  console.log(
    `Topic: ${sourceBatch.topicName} with Batch ${sourceBatch.batchId} completed: ${batchResult.successfulSources.length} successful, ${batchResult.failedSources.length} failed, ${totalArticlesAfterFiltering} articles after NOT filtering`
  );

  return response;
}
