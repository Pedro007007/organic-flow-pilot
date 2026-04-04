import { useSubscription } from "@/hooks/useSubscription";
import { getUsageLimits, formatLimit, isWithinLimit } from "@/lib/usageLimits";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, FileText, Tag, Users, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UsageLimitsCard() {
  const { user } = useAuth();
  const { subscribed, tier } = useSubscription();
  const navigate = useNavigate();
  const limits = getUsageLimits(tier, subscribed);

  const [counts, setCounts] = useState({ keywords: 0, content: 0, brands: 0, team: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("keywords").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("content_items").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("brands").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("team_invites").select("id", { count: "exact", head: true }),
    ]).then(([kw, ci, br, tm]) => {
      setCounts({
        keywords: kw.count || 0,
        content: ci.count || 0,
        brands: br.count || 0,
        team: (tm.count || 0) + 1,
      });
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/70 backdrop-blur-xl">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    { label: "Keywords", icon: Key, current: counts.keywords, max: limits.maxKeywords },
    { label: "Content Articles", icon: FileText, current: counts.content, max: limits.maxContentArticles },
    { label: "Brands", icon: Tag, current: counts.brands, max: limits.maxBrands },
    { label: "Team Members", icon: Users, current: counts.team, max: limits.maxTeamMembers },
  ];

  return (
    <Card className="border-border/50 bg-card/70 backdrop-blur-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Usage & Limits
          <Badge variant="outline" className="text-[10px] ml-auto">
            {tier ? tier.toUpperCase() : "NO PLAN"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const pct = item.max === -1 ? 0 : Math.min((item.current / item.max) * 100, 100);
          const atLimit = item.max !== -1 && !isWithinLimit(item.current, item.max);

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {item.label}
                </div>
                <span className={`text-xs font-semibold ${atLimit ? "text-destructive" : "text-muted-foreground"}`}>
                  {item.current} / {formatLimit(item.max)}
                </span>
              </div>
              <Progress value={item.max === -1 ? 5 : pct} className="h-1.5" />
              {atLimit && (
                <button
                  onClick={() => navigate("/pricing")}
                  className="text-[10px] text-destructive hover:underline mt-0.5"
                >
                  Limit reached — upgrade plan →
                </button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
