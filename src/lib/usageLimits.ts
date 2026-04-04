import { type TierKey } from "@/hooks/useSubscription";

// Usage limits per subscription tier
export const USAGE_LIMITS: Record<TierKey | "none", {
  maxKeywords: number;
  maxContentArticles: number; // per month
  maxBrands: number;
  maxTeamMembers: number;
  llmSearchLab: boolean;
  competitorScanner: boolean;
  contentRepurposing: boolean;
  whitelabelReports: boolean;
  apiAccess: boolean;
}> = {
  none: {
    maxKeywords: 0,
    maxContentArticles: 0,
    maxBrands: 0,
    maxTeamMembers: 0,
    llmSearchLab: false,
    competitorScanner: false,
    contentRepurposing: false,
    whitelabelReports: false,
    apiAccess: false,
  },
  basic: {
    maxKeywords: 50,
    maxContentArticles: 5,
    maxBrands: 1,
    maxTeamMembers: 2,
    llmSearchLab: false,
    competitorScanner: false,
    contentRepurposing: false,
    whitelabelReports: false,
    apiAccess: false,
  },
  pro: {
    maxKeywords: 500,
    maxContentArticles: -1, // unlimited
    maxBrands: 5,
    maxTeamMembers: 10,
    llmSearchLab: true,
    competitorScanner: true,
    contentRepurposing: true,
    whitelabelReports: false,
    apiAccess: false,
  },
  enterprise: {
    maxKeywords: -1, // unlimited
    maxContentArticles: -1,
    maxBrands: -1,
    maxTeamMembers: -1,
    llmSearchLab: true,
    competitorScanner: true,
    contentRepurposing: true,
    whitelabelReports: true,
    apiAccess: true,
  },
};

export function getUsageLimits(tier: TierKey | null, isSubscribed: boolean) {
  if (!isSubscribed || !tier) return USAGE_LIMITS.free;
  return USAGE_LIMITS[tier];
}

export function isWithinLimit(current: number, max: number): boolean {
  if (max === -1) return true; // unlimited
  return current < max;
}

export function formatLimit(max: number): string {
  if (max === -1) return "Unlimited";
  return max.toString();
}
