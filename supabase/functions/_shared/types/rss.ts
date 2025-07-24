/**
 * Shared RSS-related type definitions
 * Used across multiple edge functions that process RSS feeds
 */

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  rssFeedUrl: string;
  score: number;
  language?: string;
  contentFetching?: "SCRAPING" | "RSS_ONLY";
  topicId?: string;
  topicName?: string;
}

export interface RSSArticle {
  title: string;
  description: string;
  content: string;
  contentSnippet: string;
  summary: string;
  fullContentBody: string;
  contentEncoded: string;
  contentSnippetEncoded: string;
  link: string;
  pubDate: string;
  author: string;
  guid: string;
  source: string;
  sourceId: string;
  sourceScore: number;
}

export interface EnrichedRSSArticle extends RSSArticle {
  originalSourceId: string;
  originalSourceName: string;
  sourceName: string;
  sourceRssFeedUrl: string;
  sourceContentFetching: string;
  feedLanguage: string;
  topicId: string;
  topicName: string;
}

export interface ProcessedRSSSource extends RSSSource {
  articles: RSSArticle[];
  articlesCount?: number;
  lastFetched: string;
  feedTitle?: string;
  feedDescription?: string;
  feedLanguage?: string;
  feedLink?: string;
  error?: string;
  success: boolean;
}

export interface RSSParserConfig {
  timeout: number;
  headers: Record<string, string>;
}

export interface BatchProcessingResult {
  processedSources: ProcessedRSSSource[];
  successfulSources: ProcessedRSSSource[];
  failedSources: ProcessedRSSSource[];
  processingTimeMs: number;
}
