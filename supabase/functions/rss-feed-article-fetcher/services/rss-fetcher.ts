/**
 * RSS Feed fetching service
 * Handles fetching and processing individual RSS feeds
 */

import type {
  RSSSource,
  RSSArticle,
  ProcessedRSSSource,
} from "../../_shared/types/rss.ts";
import { defaultRSSParser } from "../../_shared/services/rss-parser.ts";
import {
  safeToString,
  safeParseDateToISO,
} from "../../_shared/utils/data-conversion.ts";

/**
 * Fetch and process RSS feed for a single source
 */
export async function fetchRSSFeed(
  source: RSSSource
): Promise<ProcessedRSSSource> {
  try {
    if (!source.rssFeedUrl) {
      console.warn(`No RSS feed URL for source: ${source.name}`);
      return {
        ...source,
        articles: [],
        error: "No RSS feed URL provided",
        success: false,
        lastFetched: new Date().toISOString(),
      };
    }

    const feed = await defaultRSSParser.parseURL(source.rssFeedUrl);

    // Map RSS feed items to articles with safe string conversion
    const articles: RSSArticle[] = feed.items.map((item: any) => ({
      title: safeToString(item.title),
      description: safeToString(item.contentSnippet || item.content),
      content: safeToString(item.content),
      contentSnippet: safeToString(item.contentSnippet),
      summary: safeToString(item.summary),
      fullContentBody: safeToString(item.full_content_body),
      contentEncoded: safeToString(item["content:encoded"]),
      contentSnippetEncoded: safeToString(item["content:encodedSnippet"]),
      link: safeToString(item.link),
      pubDate: safeParseDateToISO(item.pubDate || item.isoDate),
      author: safeToString(item.creator || item.author),
      guid: safeToString(item.guid || item.id),
      source: source.name,
      sourceId: source.id,
      sourceScore: source.score,
    }));

    return {
      ...source,
      articles,
      articlesCount: articles.length,
      lastFetched: new Date().toISOString(),
      feedTitle: safeToString(feed.title) || source.name,
      feedDescription: safeToString(feed.description),
      feedLanguage: safeToString(feed.language) || source.language || "",
      feedLink: safeToString(feed.link) || source.url,
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.warn(`Error fetching RSS feed for ${source.name}:`, errorMessage);

    return {
      ...source,
      articles: [],
      error: errorMessage,
      lastFetched: new Date().toISOString(),
      success: false,
    };
  }
}
