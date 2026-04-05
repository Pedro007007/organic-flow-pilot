import { useAuth } from "@/hooks/useAuth";
import { useSubscription, SUBSCRIPTION_TIERS, type TierKey } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Rocket, Building2, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const features: Record<TierKey, string[]> = {
  basic: [
    "10–20 blog articles/month",
    "Basic AEO scoring",
    "FAQ generation",
    "Basic internal linking",
    "Limited backlink tracking",
    "50 keywords tracked",
    "1 brand profile",
    "SEO checklist",
    "Email support",
  ],
  pro: [
    "50–100 blog articles/month",
    "Full AEO scoring + AI optimisation agent",
    "AI FAQ expansion",
    "Smart internal linking (XML sitemap)",
    "Backlink management + placement control",
    "Content versioning (V1, V2, V3 with scoring)",
    "Repurposing system (blog → social/email)",
    "500 keywords tracked",
    "5 brand profiles",
    "LLM Search Lab",
    "Competitor scanning",
    "CRM/email integrations",
    "Priority support",
  ],
  enterprise: [
    "Unlimited high-volume content generation",
    "Full AI agent system (SEO + AEO + email + reviews)",
    "Custom workflows (bespoke builds)",
    "Advanced backlink strategy",
    "Multi-location SEO",
    "Review automation system",
    "Unlimited brands & keywords",
    "Dedicated account manager / strategist",
    "Monthly strategy calls",
    "Custom integrations (CRM, API)",
    "White-label reports",
    "API access",
    "SLA guarantee",
  ],
};

const tierDescriptions: Record<TierKey, string> = {
  basic: "For small businesses just getting started with SEO & AEO. Low barrier entry into the ecosystem.",
  pro: "For businesses actively trying to grow. Full toolkit for real ROI and measurable organic growth.",
  enterprise: "You're not buying a tool — you're gaining a growth partner. Done-with-you growth system.",
};

const tierIcons: Record<TierKey, React.ReactNode> = {
  basic: <Rocket className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  enterprise: <Building2 className="h-6 w-6" />,
};

const tierColors: Record<TierKey, { border: string; bg: string; text: string; badge: string; button: string }> = {
  basic: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-500",
    badge: "bg-red-600 text-white font-semibold",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  pro: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-500",
    badge: "bg-red-600 text-white font-semibold",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  enterprise: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    text: "text-orange-500",
    badge: "bg-orange-600 text-white font-semibold",
    button: "bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white",
  },
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, tier: currentTier, loading, openCheckout, openCustomerPortal } = useSubscription();

  const handleSubscribe = async (tierKey: TierKey) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      await openCheckout(SUBSCRIPTION_TIERS[tierKey].price_id);
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    }
  };

  const handleManage = async () => {
    try {
      await openCustomerPortal();
    } catch {
      toast.error("Failed to open subscription management.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-amber-400" />
            <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Scale your organic visibility with the right Searchera plan. All plans include a 14-day money-back guarantee.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.entries(SUBSCRIPTION_TIERS) as [TierKey, typeof SUBSCRIPTION_TIERS[TierKey]][]).map(([key, tier]) => {
              const isCurrentPlan = subscribed && currentTier === key;
              const colors = tierColors[key];
              const isPro = key === "pro";

              return (
                <Card
                  key={key}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${colors.border} ${colors.bg} ${isPro ? "ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10" : ""}`}
                >
                  {isPro && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-br-lg">
                      YOUR PLAN
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className={`flex items-center gap-2 ${colors.text} mb-2`}>
                      {tierIcons[key]}
                      <Badge className={colors.badge}>{tier.label}</Badge>
                    </div>
                    <CardTitle className="text-2xl text-foreground">{tier.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {tierDescriptions[key]}
                    </p>
                    <div className="mt-3">
                      <span className="text-4xl font-bold">${tier.price.toLocaleString()}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {key === "enterprise" && (
                      <p className="text-xs text-muted-foreground mt-1">Optional setup fee: £2K–£5K (one-time)</p>
                    )}
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {features[key].map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className={`h-4 w-4 mt-0.5 shrink-0 ${colors.text}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <Button onClick={handleManage} variant="outline" className="w-full">
                        Manage Subscription
                      </Button>
                    ) : key === "enterprise" ? (
                      <Button
                        onClick={() => navigate("/contact")}
                        className={`w-full ${colors.button}`}
                      >
                        Contact Sales
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(key)}
                        className={`w-full ${colors.button}`}
                      >
                        {subscribed ? "Switch Plan" : "Get Started"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {subscribed && (
          <div className="mt-8 text-center">
            <Button variant="link" onClick={handleManage} className="text-muted-foreground">
              Manage billing, payment method, or cancel →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
