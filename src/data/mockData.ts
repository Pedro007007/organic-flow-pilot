import type { KeywordOpportunity, ContentItem, AgentStatus, PerformanceMetric } from "@/types/seo";

export const mockMetrics: PerformanceMetric[] = [
  { label: "Organic Impressions", value: "284,391", change: 18.3, changeLabel: "vs last month" },
  { label: "Organic Clicks", value: "12,847", change: 24.1, changeLabel: "vs last month" },
  { label: "Avg. Position", value: "14.2", change: -3.1, changeLabel: "improved" },
  { label: "Indexed Pages", value: "186", change: 12, changeLabel: "new this month" },
];

export const mockKeywords: KeywordOpportunity[] = [
  { id: "1", keyword: "ai seo tools 2026", searchIntent: "commercial", impressions: 8420, clicks: 186, ctr: 2.2, position: 12, opportunity: "high", contentType: "guide", supportingKeywords: ["best ai seo software", "ai content optimization"] },
  { id: "2", keyword: "how to improve organic ctr", searchIntent: "informational", impressions: 5230, clicks: 94, ctr: 1.8, position: 18, opportunity: "high", contentType: "blog", supportingKeywords: ["meta description tips", "title tag optimization"] },
  { id: "3", keyword: "content refresh strategy", searchIntent: "informational", impressions: 3100, clicks: 142, ctr: 4.6, position: 9, opportunity: "medium", contentType: "guide", supportingKeywords: ["update old blog posts", "content decay"] },
  { id: "4", keyword: "programmatic seo guide", searchIntent: "informational", impressions: 6800, clicks: 78, ctr: 1.1, position: 22, opportunity: "high", contentType: "guide", supportingKeywords: ["automated seo", "seo at scale"] },
  { id: "5", keyword: "seo for ai search engines", searchIntent: "informational", impressions: 4500, clicks: 210, ctr: 4.7, position: 8, opportunity: "medium", contentType: "blog", supportingKeywords: ["llm optimization", "ai answer optimization"] },
  { id: "6", keyword: "keyword cannibalization fix", searchIntent: "transactional", impressions: 2900, clicks: 65, ctr: 2.2, position: 15, opportunity: "medium", contentType: "blog", supportingKeywords: ["merge pages seo", "duplicate content"] },
];

export const mockContent: ContentItem[] = [
  { id: "1", title: "The Complete Guide to AI SEO Tools in 2026", keyword: "ai seo tools 2026", status: "published", author: "Agent", lastUpdated: "2026-02-08", impressions: 2340, clicks: 189, position: 6, url: "/blog/ai-seo-tools-2026" },
  { id: "2", title: "How to Fix Keyword Cannibalization", keyword: "keyword cannibalization fix", status: "optimizing", author: "Agent", lastUpdated: "2026-02-09" },
  { id: "3", title: "Content Refresh Strategy: A Data-Driven Approach", keyword: "content refresh strategy", status: "writing", author: "Agent", lastUpdated: "2026-02-10" },
  { id: "4", title: "Programmatic SEO: Build Pages at Scale", keyword: "programmatic seo guide", status: "strategy", author: "Agent", lastUpdated: "2026-02-10" },
  { id: "5", title: "Optimising for AI Search Engines", keyword: "seo for ai search engines", status: "published", author: "Agent", lastUpdated: "2026-02-05", impressions: 4500, clicks: 210, position: 8, url: "/blog/seo-ai-search" },
  { id: "6", title: "Improve Your Organic CTR in 5 Steps", keyword: "how to improve organic ctr", status: "discovery", author: "Agent", lastUpdated: "2026-02-10" },
];

export const mockAgents: AgentStatus[] = [
  { id: "1", name: "Keyword Discovery", description: "Identifies high-value keyword opportunities from GSC data", status: "completed", lastRun: "2 min ago", itemsProcessed: 6 },
  { id: "2", name: "Content Strategy", description: "Turns keywords into structured content plans", status: "running", lastRun: "now", itemsProcessed: 3 },
  { id: "3", name: "Content Generation", description: "Writes human-quality, intent-based SEO content", status: "idle", lastRun: "1 hour ago", itemsProcessed: 0 },
  { id: "4", name: "SEO Optimisation", description: "Finalises meta, schema, links for max visibility", status: "completed", lastRun: "30 min ago", itemsProcessed: 2 },
  { id: "5", name: "Publishing", description: "Ships content to CMS and triggers indexing", status: "idle", lastRun: "3 hours ago", itemsProcessed: 0 },
  { id: "6", name: "Monitoring & Refresh", description: "Tracks performance and flags refresh opportunities", status: "running", lastRun: "now", itemsProcessed: 12 },
];
