/**
 * Configuration constants for RSS Feed Article Fetcher function
 */

export const BATCH_CONFIG = {
  DEFAULT_BATCH_SIZE: 25,
  BATCH_DELAY_MS: 1000,
} as const;

export const PROCESSING_CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT_MS: 20000,
} as const;

export const RESPONSE_CONFIG = {
  INCLUDE_DEBUG_INFO: false,
  MAX_ARTICLES_PER_RESPONSE: 10000,
} as const;
