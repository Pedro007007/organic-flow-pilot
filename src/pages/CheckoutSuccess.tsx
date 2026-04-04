import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Crown, ArrowRight, Loader2 } from "lucide-react";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscribed, tier, loading, checkSubscription } = useSubscription();

  // Fire confetti on mount
  useEffect(() => {
    const gold = ["#FFD700", "#FFC107", "#FFAA00", "#FF8F00", "#FFE082"];
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.4 }, colors: gold });
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.3, x: 0.2 }, colors: gold }), 300);
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.3, x: 0.8 }, colors: gold }), 600);
    setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { y: 0.5 }, colors: gold }), 1000);
  }, []);

  // Refresh subscription status
  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 5000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const planInfo = tier ? SUBSCRIPTION_TIERS[tier] : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-border/50 bg-card/70 backdrop-blur-xl shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Searchera!</h1>
            <p className="text-muted-foreground text-sm">
              Your subscription is now active. Thank you for choosing Searchera.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming your plan...
            </div>
          ) : planInfo ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Your Plan</p>
              <p className="text-xl font-bold text-foreground">{planInfo.name}</p>
              <p className="text-sm text-muted-foreground">{planInfo.label} — ${planInfo.price.toLocaleString()}/month</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                Your subscription is being processed. It may take a moment to confirm.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-primary text-primary-foreground"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="w-full text-muted-foreground"
            >
              View Plan Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
