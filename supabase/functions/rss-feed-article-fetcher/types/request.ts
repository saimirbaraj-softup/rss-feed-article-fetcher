/**
 * Request type definitions for RSS Feed Article Fetcher function
 */

import type { RSSSource } from "../../_shared/types/rss.ts";

export interface KeywordItem {
  keyword: string;
}

export interface RelationshipItem {
  type: "NOT" | "INCLUDE" | "EXCLUDE";
  keywords: KeywordItem[];
}

export interface RelationshipKeyword {
  items: RelationshipItem[];
}

export interface TopicKeyword {
  keyword: string;
  type: "INCLUDE" | "EXCLUDE";
}

export interface SourceBatch {
  batchId: string;
  batchNumber: number;
  totalBatches: number;
  topicId: string;
  topicName: string;
  sources: RSSSource[];
  relationshipKeywords?: RelationshipKeyword[];
  keywords?: TopicKeyword[];
}

export interface ArticleFetchRequest {
  sourceBatch: SourceBatch;
}
