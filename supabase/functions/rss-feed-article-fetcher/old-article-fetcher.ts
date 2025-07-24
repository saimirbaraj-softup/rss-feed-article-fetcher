// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Parser from "npm:rss-parser@3.13.0";
console.info("Article Fetcher server started");
// Helper function to safely convert to string
function safeToString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
// Initialize RSS parser
const parser = new Parser({
  timeout: 20000,
  headers: {
    Accept:
      "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
  },
});
// Article filtering utility for NOT keywords
class NotKeywordFilter {
  /**
   * Exact keyword matching function with word boundaries - no plurals or variations
   */ static createKeywordMatcher(keyword) {
    // Escape special regex characters but preserve word structure
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Create exact pattern with word boundaries - no variations
    const exactPattern = `\\b${escaped}\\b`;
    return new RegExp(exactPattern, "gi");
  }
  /**
   * Check if text matches a keyword using enhanced matching
   */ static matchesKeyword(searchText, keyword) {
    const matcher = this.createKeywordMatcher(keyword);
    return matcher.test(searchText);
  }
  /**
   * Get searchable text from article with safe string conversion
   */ static getSearchableText(article) {
    const title = safeToString(article.title).toLowerCase();
    const description = safeToString(article.description).toLowerCase();
    return `${title} ${description}`.trim();
  }
  /**
   * Filter out articles with NOT keywords
   */ static filterOutNotKeywords(articles, relationshipKeywords) {
    const discardedArticlesResults = {
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
    // Get all NOT keywords from all relationship items
    const notKeywords = [];
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
      const matchedNotKeywords = [];
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
// Function to fetch RSS feed for a single source
async function fetchRSSFeed(source) {
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
    const feed = await parser.parseURL(source.rssFeedUrl);
    // Map RSS feed items to articles with safe string conversion
    const articles = feed.items.map((item) => ({
      title: safeToString(item.title),
      description: safeToString(item.contentSnippet || item.content),
      content: safeToString(item.content),
      contentSnippet: safeToString(item.contentSnippet),
      summary: safeToString(item.summary),
      fullContentBody: safeToString(item.full_content_body),
      contentEncoded: safeToString(item["content:encoded"]),
      contentSnippetEncoded: safeToString(item["content:encodedSnippet"]),
      link: safeToString(item.link),
      pubDate: safeToString(item.pubDate || item.isoDate),
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
    console.warn(`Error fetching RSS feed for ${source.name}:`, error.message);
    return {
      ...source,
      articles: [],
      error: error.message,
      lastFetched: new Date().toISOString(),
      success: false,
    };
  }
}
// Function to process sources in batches
async function processBatchSources(sources, batchSize = 25) {
  const results = [];
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
        console.error(
          `Failed to process source ${batch[index].name}:`,
          result.reason
        );
        results.push({
          ...batch[index],
          articles: [],
          error: result.reason?.message || "Unknown error occurred",
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
  return results;
}
Deno.serve(async (req) => {
  try {
    const { sourceBatch } = await req.json();
    if (
      !sourceBatch ||
      !sourceBatch.sources ||
      !Array.isArray(sourceBatch.sources)
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid sourceBatch object or sources array not provided",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            Connection: "keep-alive",
          },
        }
      );
    }
    console.log(
      `Processing Topic: ${sourceBatch.topicName} - batch ${sourceBatch.batchId} with ${sourceBatch.sources.length} sources`
    );
    const startTime = new Date();
    // Process sources in batches of 25
    const processedSources = await processBatchSources(sourceBatch.sources, 25);
    // Separate successful and failed sources
    const successfulSources = processedSources.filter(
      (source) => source.success
    );
    const failedSources = processedSources.filter((source) => !source.success);
    // Collect all articles from successful sources with enhanced metadata
    const allArticles = [];
    successfulSources.forEach((source) => {
      if (source.articles && source.articles.length > 0) {
        source.articles.forEach((article) => {
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
            topicId: source.topicId,
            topicName: source.topicName,
          });
        });
      }
    });
    // Apply NOT keyword filtering
    const filteringResult = NotKeywordFilter.filterOutNotKeywords(
      allArticles,
      sourceBatch.relationshipKeywords || []
    );
    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();
    // Calculate statistics
    const totalArticlesFetched = allArticles.length;
    const totalArticlesAfterFiltering = filteringResult.filteredArticles.length;
    const totalArticlesDiscarded =
      filteringResult.discardedArticlesResults.totalDiscarded;
    const responseData = {
      success: true,
      batchDetails: {
        batchId: sourceBatch.batchId,
        batchNumber: sourceBatch.batchNumber,
        totalBatches: sourceBatch.totalBatches,
        topicId: sourceBatch.topicId,
        topicName: sourceBatch.topicName,
        processedAt: endTime.toISOString(),
        processingTimeMs: processingTime,
      },
      processingStats: {
        totalSourcesProcessed: processedSources.length,
        successfulSources: successfulSources.length,
        failedSources: failedSources.length,
        totalArticlesFetched,
        totalArticlesAfterFiltering,
        totalArticlesDiscarded,
        filteringApplied: (sourceBatch.relationshipKeywords?.length || 0) > 0,
      },
      failedSources: failedSources.map((source) => ({
        id: source.id,
        name: source.name,
        url: source.url,
        rssFeedUrl: source.rssFeedUrl,
        error: source.error,
        success: source.success,
        lastFetched: source.lastFetched,
      })),
      discardedArticlesResults: filteringResult.discardedArticlesResults,
      articles: filteringResult.filteredArticles,
      relationshipKeywords: sourceBatch.relationshipKeywords || [],
      topicKeywords: sourceBatch.keywords || [],
    };
    console.log(
      `Topic: ${sourceBatch.topicName} with Batch ${sourceBatch.batchId} completed: ${successfulSources.length} successful, ${failedSources.length} failed, ${totalArticlesAfterFiltering} articles after NOT filtering`
    );
    return new Response(JSON.stringify(responseData), {
      headers: {
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in article-fetcher:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
      }
    );
  }
});
