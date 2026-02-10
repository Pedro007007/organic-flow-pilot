export interface KeywordOpportunity {
  id: string;
  keyword: string;
  searchIntent: "informational" | "commercial" | "transactional" | "local";
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  opportunity: "low" | "medium" | "high";
  contentType: "blog" | "landing_page" | "guide" | "faq";
  supportingKeywords: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  keyword: string;
  status: "discovery" | "strategy" | "writing" | "optimizing" | "published" | "monitoring";
  author: string;
  lastUpdated: string;
  impressions?: number;
  clicks?: number;
  position?: number;
  url?: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  description: string;
  status: "idle" | "running" | "completed" | "error";
  lastRun?: string;
  itemsProcessed?: number;
}

export interface PerformanceMetric {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
}
