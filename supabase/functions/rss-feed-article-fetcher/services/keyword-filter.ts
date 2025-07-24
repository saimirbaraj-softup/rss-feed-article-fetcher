/**
 * Keyword filtering service for RSS articles
 * Handles NOT keyword filtering with exact word boundary matching
 */

import type { EnrichedRSSArticle } from "../../_shared/types/rss.ts";
import type { RelationshipKeyword } from "../types/request.ts";
import type { DiscardedArticlesResults } from "../types/response.ts";
import { safeToString } from "../../_shared/utils/data-conversion.ts";

export interface FilteringResult {
  filteredArticles: EnrichedRSSArticle[];
  discardedArticlesResults: DiscardedArticlesResults;
}

/**
 * Advanced keyword filtering utility for RSS articles
 */
export class NotKeywordFilter {
  /**
   * Create exact keyword matcher with word boundaries - no plurals or variations
   */
  private static createKeywordMatcher(keyword: string): RegExp {
    // Escape special regex characters but preserve word structure
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create exact pattern with word boundaries - no variations
    const exactPattern = `\\b${escaped}\\b`;
    return new RegExp(exactPattern, "gi");
  }

  /**
   * Check if text matches a keyword using enhanced matching
   */
  private static matchesKeyword(searchText: string, keyword: string): boolean {
    const matcher = this.createKeywordMatcher(keyword);
    return matcher.test(searchText);
  }

  /**
   * Get searchable text from article with safe string conversion
   */
  private static getSearchableText(article: EnrichedRSSArticle): string {
    const title = safeToString(article.title).toLowerCase();
    const description = safeToString(article.description).toLowerCase();
    return `${title} ${description}`.trim();
  }

  /**
   * Extract NOT keywords from relationship keywords structure
   */
  private static extractNotKeywords(
    relationshipKeywords: RelationshipKeyword[]
  ): string[] {
    const notKeywords: string[] = [];

    relationshipKeywords.forEach((relationship) => {
      if (relationship.items) {
        relationship.items.forEach((item) => {
          if (item.type === "NOT" && item.keywords) {
            item.keywords.forEach((keywordObj) => {
              if (keywordObj.keyword) {
                notKeywords.push(keywordObj.keyword.toLowerCase());
              }
            });
          }
        });
      }
    });

    return notKeywords;
  }

  /**
   * Filter out articles containing NOT keywords
   */
  public static filterOutNotKeywords(
    articles: EnrichedRSSArticle[],
    relationshipKeywords: RelationshipKeyword[] = []
  ): FilteringResult {
    const discardedArticlesResults: DiscardedArticlesResults = {
      totalDiscarded: 0,
      discardedByNoContent: 0,
      discardedByNotKeywords: 0,
      keywordDiscardStats: {},
    };

    if (!relationshipKeywords || relationshipKeywords.length === 0) {
      return {
        filteredArticles: articles,
        discardedArticlesResults,
      };
    }

    const notKeywords = this.extractNotKeywords(relationshipKeywords);

    if (notKeywords.length === 0) {
      return {
        filteredArticles: articles,
        discardedArticlesResults,
      };
    }

    const filteredArticles = articles.filter((article) => {
      const searchText = this.getSearchableText(article);

      if (!searchText) {
        discardedArticlesResults.totalDiscarded++;
        discardedArticlesResults.discardedByNoContent++;
        return false;
      }

      // Check if article contains any NOT keywords
      const matchedNotKeywords: string[] = [];
      notKeywords.forEach((keyword) => {
        if (this.matchesKeyword(searchText, keyword)) {
          matchedNotKeywords.push(keyword);
        }
      });

      if (matchedNotKeywords.length > 0) {
        discardedArticlesResults.totalDiscarded++;
        discardedArticlesResults.discardedByNotKeywords++;

        // Track which keywords caused discards
        matchedNotKeywords.forEach((keyword) => {
          discardedArticlesResults.keywordDiscardStats[keyword] =
            (discardedArticlesResults.keywordDiscardStats[keyword] || 0) + 1;
        });

        return false;
      }

      return true;
    });

    return {
      filteredArticles,
      discardedArticlesResults,
    };
  }
}
