/**
 * Response type definitions for RSS Feed Article Fetcher function
 */

import type {
  EnrichedRSSArticle,
  ProcessedRSSSource,
} from "../../_shared/types/rss.ts";
import type { RelationshipKeyword, TopicKeyword } from "./request.ts";

export interface BatchDetails {
  batchId: string;
  batchNumber: number;
  totalBatches: number;
  topicId: string;
  topicName: string;
  processedAt: string;
  processingTimeMs: number;
}

export interface ProcessingStats {
  totalSourcesProcessed: number;
  successfulSources: number;
  failedSources: number;
  totalArticlesFetched: number;
  totalArticlesAfterFiltering: number;
  totalArticlesDiscarded: number;
  filteringApplied: boolean;
}

export interface FailedSourceInfo {
  id: string;
  name: string;
  url: string;
  rssFeedUrl: string;
  error: string;
  success: false;
  lastFetched: string;
}

export interface DiscardedArticlesResults {
  totalDiscarded: number;
  discardedByNoContent: number;
  discardedByNotKeywords: number;
  keywordDiscardStats: Record<string, number>;
}

export interface ArticleFetchResponse {
  success: true;
  batchDetails: BatchDetails;
  processingStats: ProcessingStats;
  failedSources: FailedSourceInfo[];
  discardedArticlesResults: DiscardedArticlesResults;
  articles: EnrichedRSSArticle[];
  relationshipKeywords: RelationshipKeyword[];
  topicKeywords: TopicKeyword[];
}

export interface ArticleFetchErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}
