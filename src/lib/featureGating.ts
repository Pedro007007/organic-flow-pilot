import { type TierKey } from "@/hooks/useSubscription";

// Define which sidebar sections are available per tier
// null = available to all subscribers, otherwise minimum tier required
const FEATURE_ACCESS: Record<string, TierKey | null> = {
  dashboard: null,
  keywords: null,
  content: null,
  rankings: "basic",
  "llm-search": "pro",
  calendar: "basic",
  agents: "basic",
  analytics: "basic",
  scanner: "pro",
  reports: "pro",
  leads: "pro",
  checklist: null,
  brands: "basic",
  referrals: null,
  team: "pro",
  settings: null,
};

const TIER_HIERARCHY: Record<TierKey, number> = {
  basic: 1,
  pro: 2,
  enterprise: 3,
};

export function hasFeatureAccess(
  sectionId: string,
  currentTier: TierKey | null,
  isSubscribed: boolean
): boolean {
  const requiredTier = FEATURE_ACCESS[sectionId];
  // Base features accessible to all subscribers
  if (requiredTier === null) return true;
  // If not subscribed, no access to paid features
  if (!isSubscribed || !currentTier) return false;
  // Check tier hierarchy
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
}

export function getRequiredTier(sectionId: string): TierKey | null {
  return FEATURE_ACCESS[sectionId] ?? null;
}

export function getTierLabel(tier: TierKey): string {
  const labels: Record<TierKey, string> = {
    basic: "Basic",
    pro: "Pro",
    enterprise: "Enterprise",
  };
  return labels[tier];
}
