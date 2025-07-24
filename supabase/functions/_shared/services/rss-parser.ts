/**
 * Shared RSS Parser service with standardized configuration
 * Can be reused across multiple edge functions that need RSS parsing
 */

import Parser from "npm:rss-parser@3.13.0";
import type { RSSParserConfig } from "../types/rss.ts";

/**
 * Default RSS parser configuration
 */
export const DEFAULT_RSS_CONFIG: RSSParserConfig = {
  timeout: 20000,
  headers: {
    Accept:
      "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
    "User-Agent": "RSS-Feed-Fetcher/1.0",
  },
};

/**
 * Create an RSS parser instance with custom or default configuration
 */
export function createRSSParser(config: Partial<RSSParserConfig> = {}): Parser {
  const finalConfig = {
    ...DEFAULT_RSS_CONFIG,
    ...config,
  };

  return new Parser(finalConfig);
}

/**
 * Singleton RSS parser instance with default configuration
 */
export const defaultRSSParser = createRSSParser();

/**
 * Parse RSS feed from URL with error handling
 * @param url - RSS feed URL to parse
 * @param parser - Optional custom parser instance
 * @returns Parsed RSS feed or null if failed
 */
export async function parseRSSFeed(
  url: string,
  parser: Parser = defaultRSSParser
): Promise<Parser.Output<any> | null> {
  try {
    return await parser.parseURL(url);
  } catch (error) {
    console.warn(`Failed to parse RSS feed from ${url}:`, error);
    return null;
  }
}
