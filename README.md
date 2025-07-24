# RSS Feed Article Fetcher Edge Function

A high-performance Supabase Edge Function that fetches, processes, and filters articles from multiple RSS feeds with advanced keyword filtering capabilities and batch processing.

## 🚀 Features

- **Batch Processing**: Processes RSS sources in configurable batches (default: 25) to optimize performance
- **Advanced Filtering**: NOT keyword filtering with exact word boundary matching
- **Robust Error Handling**: Graceful handling of failed feeds with detailed error reporting
- **Enhanced Metadata**: Enriches articles with source information, topic data, and processing statistics
- **Safe Data Conversion**: Handles various RSS feed formats with safe string conversion utilities
- **Comprehensive Statistics**: Detailed processing metrics including timing and filtering results

## 📋 API Documentation

### Endpoint

```
POST /functions/v1/rss-feed-article-fetcher
```

### Request Format

#### Headers

```
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json
```

#### Request Body

```json
{
  "sourceBatch": {
    "batchId": "string",
    "batchNumber": 1,
    "totalBatches": 3,
    "topicId": "string",
    "topicName": "Technology News",
    "sources": [
      {
        "id": "source-id-1",
        "name": "TechCrunch",
        "url": "https://techcrunch.com",
        "rssFeedUrl": "https://techcrunch.com/feed/",
        "score": 85,
        "language": "en",
        "contentFetching": "SCRAPING",
        "topicId": "tech-topic-id",
        "topicName": "Technology"
      }
    ],
    "relationshipKeywords": [
      {
        "items": [
          {
            "type": "NOT",
            "keywords": [
              {
                "keyword": "advertisement"
              },
              {
                "keyword": "sponsored"
              }
            ]
          }
        ]
      }
    ],
    "keywords": [
      {
        "keyword": "AI",
        "type": "INCLUDE"
      }
    ]
  }
}
```

### Response Format

#### Success Response (200)

```json
{
  "success": true,
  "batchDetails": {
    "batchId": "batch-123",
    "batchNumber": 1,
    "totalBatches": 3,
    "topicId": "tech-topic-id",
    "topicName": "Technology News",
    "processedAt": "2024-01-15T10:30:00.000Z",
    "processingTimeMs": 5432
  },
  "processingStats": {
    "totalSourcesProcessed": 25,
    "successfulSources": 23,
    "failedSources": 2,
    "totalArticlesFetched": 587,
    "totalArticlesAfterFiltering": 521,
    "totalArticlesDiscarded": 66,
    "filteringApplied": true
  },
  "failedSources": [
    {
      "id": "failed-source-id",
      "name": "Failed Source",
      "url": "https://example.com",
      "rssFeedUrl": "https://example.com/feed",
      "error": "Timeout after 20000ms",
      "success": false,
      "lastFetched": "2024-01-15T10:30:00.000Z"
    }
  ],
  "discardedArticlesResults": {
    "totalDiscarded": 66,
    "discardedByNoContent": 5,
    "discardedByNotKeywords": 61,
    "keywordDiscardStats": {
      "advertisement": 35,
      "sponsored": 26
    }
  },
  "articles": [
    {
      "title": "Article Title",
      "description": "Article description",
      "content": "Full article content",
      "contentSnippet": "Content snippet",
      "link": "https://example.com/article",
      "pubDate": "2024-01-15T09:00:00.000Z",
      "author": "Author Name",
      "guid": "unique-article-id",
      "source": "TechCrunch",
      "sourceId": "source-id-1",
      "sourceScore": 85,
      "originalSourceId": "source-id-1",
      "originalSourceName": "TechCrunch",
      "sourceName": "TechCrunch",
      "sourceRssFeedUrl": "https://techcrunch.com/feed/",
      "sourceContentFetching": "SCRAPING",
      "feedLanguage": "en",
      "topicId": "tech-topic-id",
      "topicName": "Technology"
    }
  ],
  "relationshipKeywords": [],
  "topicKeywords": []
}
```

#### Error Response (400/500)

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🛠 Core Components

### RSS Parser Configuration

- **Timeout**: 20 seconds per feed
- **Accept Headers**: Supports multiple RSS/XML formats
- **Batch Size**: 25 sources per batch (configurable)

### NOT Keyword Filtering

- **Exact Matching**: Uses word boundaries for precise matching
- **Case Insensitive**: Automatically converts to lowercase
- **No Variations**: Matches exact keywords only (no plurals/variations)
- **Content Areas**: Searches both title and description fields

### Article Data Structure

Each article includes comprehensive metadata:

- Standard RSS fields (title, description, content, link, pubDate, author)
- Source information (name, ID, score, RSS URL)
- Topic information (ID, name)
- Processing metadata (feed language, content fetching method)

## 📈 Performance & Limits

- **Batch Processing**: Processes up to 25 RSS sources simultaneously
- **Timeout**: 20-second timeout per RSS feed request
- **Delay**: 1-second delay between batches to avoid rate limiting
- **Error Handling**: Continues processing even if individual sources fail

## 🔧 Usage Examples

### Local Development

```bash
# Start Supabase locally
supabase start

# Test the function
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/rss-feed-article-fetcher' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  --header 'Content-Type: application/json' \
  --data '{
    "sourceBatch": {
      "batchId": "test-batch-1",
      "batchNumber": 1,
      "totalBatches": 1,
      "topicId": "test-topic",
      "topicName": "Test Topic",
      "sources": [
        {
          "id": "1",
          "name": "Test RSS",
          "rssFeedUrl": "https://feeds.npr.org/1001/rss.xml",
          "score": 90
        }
      ],
      "relationshipKeywords": []
    }
  }'
```

### Production Deployment

```javascript
// JavaScript/TypeScript client example
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/rss-feed-article-fetcher`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceBatch: {
        batchId: "batch-123",
        batchNumber: 1,
        totalBatches: 1,
        topicId: "tech-news",
        topicName: "Technology News",
        sources: rssSourcesArray,
        relationshipKeywords: filteringKeywords,
      },
    }),
  }
);

const result = await response.json();
```

## 🔍 Monitoring & Debugging

### Console Logs

The function provides detailed console logging:

- Server startup confirmation
- Batch processing progress
- Individual source warnings/errors
- Processing completion summaries

### Error Tracking

- Failed sources are collected and returned in response
- Individual errors don't stop batch processing
- Detailed error messages for debugging

### Performance Metrics

- Processing time in milliseconds
- Success/failure ratios
- Article filtering statistics
- Keyword match statistics

## 🏗 Technical Architecture

### Modular Design

The function follows a clean, modular architecture with separation of concerns:

```
supabase/functions/
├── _shared/                          # Reusable utilities across functions
│   ├── utils/
│   │   ├── data-conversion.ts        # Safe data conversion utilities
│   │   └── response-helpers.ts       # Standardized API responses
│   ├── services/
│   │   └── rss-parser.ts            # RSS parser configuration
│   └── types/
│       └── rss.ts                   # Shared RSS type definitions
│
└── rss-feed-article-fetcher/
    ├── index.ts                     # Clean main handler (67 lines)
    ├── types/
    │   ├── request.ts               # Request payload types
    │   └── response.ts              # Response payload types
    ├── services/
    │   ├── keyword-filter.ts        # NotKeywordFilter class
    │   ├── rss-fetcher.ts          # Individual RSS fetching
    │   └── batch-processor.ts       # Batch processing logic
    ├── handlers/
    │   └── article-fetch-handler.ts # Main business logic
    └── config/
        └── constants.ts             # Function-specific constants
```

### Dependencies

- `jsr:@supabase/functions-js/edge-runtime.d.ts` - Supabase Edge Runtime types
- `npm:rss-parser@3.13.0` - RSS feed parsing

### Key Components

#### Shared Utilities (`_shared/`)

- **`data-conversion.ts`** - Enhanced safe data conversion with HTML cleaning and date parsing
- **`response-helpers.ts`** - Standardized API response formatting across functions
- **`rss-parser.ts`** - Configurable RSS parser with default settings and error handling
- **`rss.ts`** - Comprehensive type definitions for RSS-related data structures

#### Function-Specific Services

- **`NotKeywordFilter`** - Advanced keyword filtering with exact word boundary matching
- **`fetchRSSFeed()`** - Individual RSS feed processor with comprehensive error handling
- **`processBatchSources()`** - Parallel batch processing coordinator with timing metrics
- **`handleArticleFetch()`** - Main business logic orchestrator

#### Type Safety

- Complete TypeScript coverage with strict typing
- Separate interfaces for requests, responses, and internal data structures
- Shared types for reusability across multiple functions

### Architecture Benefits

- **Maintainability**: Small, focused modules with single responsibilities
- **Testability**: Individual services can be unit tested in isolation
- **Reusability**: Shared utilities can be used by other edge functions
- **Type Safety**: Comprehensive TypeScript types prevent runtime errors
- **Performance**: Tree-shaking friendly imports and efficient memory usage

### Error Handling Strategy

- **Graceful Degradation**: Individual source failures don't stop batch processing
- **Centralized Error Handling**: Consistent error responses via shared utilities
- **Comprehensive Logging**: Detailed error messages for debugging
- **Timeout Protection**: 20-second timeout per RSS feed request
- **Safe Data Conversion**: Robust handling of malformed RSS feeds

## 🧪 Development & Testing

### Modular Testing Strategy

The refactored architecture enables comprehensive testing at multiple levels:

```typescript
// Example: Unit testing individual services
import { NotKeywordFilter } from './services/keyword-filter.ts';
import { fetchRSSFeed } from './services/rss-fetcher.ts';

// Test keyword filtering in isolation
const articles = [...]; // test data
const result = NotKeywordFilter.filterOutNotKeywords(articles, keywords);

// Test RSS fetching with mock data
const mockSource = { id: '1', name: 'Test', rssFeedUrl: 'test.xml' };
const result = await fetchRSSFeed(mockSource);
```

### Import Structure

The function leverages Supabase Edge Functions best practices:

```typescript
// Shared utilities (can be used by other functions)
import { safeToString } from "../_shared/utils/data-conversion.ts";
import { createErrorResponse } from "../_shared/utils/response-helpers.ts";

// Function-specific imports
import { handleArticleFetch } from "./handlers/article-fetch-handler.ts";
import type { ArticleFetchRequest } from "./types/request.ts";
```

### Development Benefits

- **Hot Reloading**: Small modules enable faster development cycles
- **Code Reuse**: Shared utilities reduce duplication across functions
- **Type Safety**: Comprehensive TypeScript prevents runtime errors
- **Debugging**: Isolated services are easier to debug and troubleshoot

## 🚦 Status Codes

| Code | Description                                |
| ---- | ------------------------------------------ |
| 200  | Success - Articles processed and returned  |
| 400  | Bad Request - Invalid sourceBatch format   |
| 500  | Internal Server Error - Processing failure |

## 🔄 Batch Processing Flow

1. **Validation**: Verify sourceBatch structure and sources array
2. **Batch Creation**: Split sources into chunks of 25
3. **Parallel Processing**: Process each batch concurrently with Promise.allSettled
4. **Article Collection**: Gather articles from successful sources
5. **Keyword Filtering**: Apply NOT keyword filtering to collected articles
6. **Response Generation**: Compile statistics and return processed results

This function is designed for high-throughput RSS processing with robust error handling, detailed monitoring capabilities, and a modern modular architecture that promotes maintainability, testability, and code reuse across multiple edge functions.
