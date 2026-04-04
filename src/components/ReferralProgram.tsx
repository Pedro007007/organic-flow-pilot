import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Copy, CheckCircle2, Users, Link2, Crown,
  Shield, ChevronDown, ChevronUp,
} from "lucide-react";

const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const referralCode = user ? `REF-${user.id.substring(0, 8).toUpperCase()}` : "";
  const referralLink = user
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share it with friends to earn rewards." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Could not copy link.", variant: "destructive" });
    }
  };

  const rewards = [
    {
      milestone: "1 referral",
      reward: "Extended free trial (30 days)",
      icon: Gift,
      gradient: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-500/25",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-600",
      badgeClass: "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
    },
    {
      milestone: "3 referrals",
      reward: "Priority AI agent processing",
      icon: Users,
      gradient: "from-blue-500/10 to-indigo-500/5",
      border: "border-blue-500/25",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-600",
      badgeClass: "border-blue-500/30 text-blue-600 bg-blue-500/10",
    },
    {
      milestone: "5 referrals",
      reward: "1 month Pro free",
      icon: Crown,
      gradient: "from-amber-500/10 to-orange-500/5",
      border: "border-amber-500/25",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-600",
      badgeClass: "border-amber-500/30 text-amber-600 bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Referral Link Card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent backdrop-blur-xl p-6 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 shadow-sm">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Invite Friends, Earn Rewards</h3>
            <p className="text-xs text-muted-foreground font-medium">Share your unique link and both of you benefit</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="flex-1 text-sm font-mono bg-background/50" />
          <Button onClick={handleCopy} variant="outline" className="gap-2 shrink-0">
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">
            Your code: <strong className="text-foreground">{referralCode}</strong>
          </span>
        </div>
      </div>

      {/* Reward Tiers */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3 px-1">Reward Milestones</h4>
        <div className="space-y-3">
          {rewards.map((r) => (
            <div
              key={r.milestone}
              className={`group relative overflow-hidden rounded-2xl border ${r.border} bg-gradient-to-r ${r.gradient} backdrop-blur-xl p-4 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-500`}
            >
              <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-current opacity-[0.03] blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.iconBg} shadow-sm shrink-0`}>
                  <r.icon className={`h-4.5 w-4.5 ${r.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">{r.reward}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{r.milestone}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${r.badgeClass}`}>Locked</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "0", label: "Invited", gradient: "from-sky-500/8 to-blue-500/3", border: "border-sky-500/20" },
          { value: "0", label: "Signed Up", gradient: "from-violet-500/8 to-purple-500/3", border: "border-violet-500/20" },
          { value: "0", label: "Rewards", gradient: "from-rose-500/8 to-pink-500/3", border: "border-rose-500/20" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-xl p-4 text-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-500`}>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Terms & Conditions */}
      <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowTerms(!showTerms)}
          className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/30">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xs font-bold text-foreground">Referral Programme Terms & Conditions</span>
          </div>
          {showTerms ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showTerms && (
          <div className="px-5 pb-5 space-y-4 animate-fade-in">
            {/* How It Works */}
            <div>
              <h5 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">How It Works</h5>
              <ol className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed list-decimal list-inside">
                <li>Share your unique referral link or code with friends, colleagues, or your network.</li>
                <li>When someone signs up using your link and creates a verified account, they count as a <strong className="text-foreground">qualified referral</strong>.</li>
                <li>Once your referral completes email verification and remains active for at least 7 days, your reward tier unlocks automatically.</li>
                <li>Rewards are cumulative — reaching 5 referrals earns you <strong className="text-foreground">all three tiers</strong>, not just the highest.</li>
              </ol>
            </div>

            {/* Eligibility */}
            <div>
              <h5 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">Eligibility & Qualification</h5>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed list-disc list-inside">
                <li>Both the referrer and the referred user must hold active, verified Searchera accounts.</li>
                <li>Self-referrals, duplicate accounts, or fraudulent sign-ups are strictly prohibited and will result in disqualification.</li>
                <li>A referral is only counted once the referred user has completed email verification and logged in at least once within 7 days of registration.</li>
                <li>Referrals made before joining the programme cannot be applied retroactively.</li>
              </ul>
            </div>

            {/* Reward Details */}
            <div>
              <h5 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">Reward Details</h5>
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                  <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10 shrink-0 mt-0.5">Tier 1</Badge>
                  <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">1 referral → 30-day extended free trial.</strong> Your trial period is extended by 30 calendar days from the date the referral qualifies. Cannot be stacked with other trial extensions.</p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                  <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-600 bg-blue-500/10 shrink-0 mt-0.5">Tier 2</Badge>
                  <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">3 referrals → Priority AI agent processing.</strong> Your AI agent jobs are placed in a priority queue for faster execution. This benefit remains active for as long as you maintain 3+ qualified referrals.</p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                  <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600 bg-amber-500/10 shrink-0 mt-0.5">Tier 3</Badge>
                  <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">5 referrals → 1 month Pro plan free.</strong> A one-time credit equivalent to one month of the Pro plan is applied to your account. If you are already on Pro, your next billing cycle is waived. If on Free, you receive 30 days of Pro access.</p>
                </div>
              </div>
            </div>

            {/* General Terms */}
            <div>
              <h5 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">General Terms</h5>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed list-disc list-inside">
                <li>Searchera reserves the right to modify, suspend, or terminate the referral programme at any time with 30 days' notice to active participants.</li>
                <li>Rewards have no cash value and are non-transferable.</li>
                <li>Any attempt to manipulate the referral system (bots, fake accounts, incentivised sign-ups) will result in permanent account suspension and forfeiture of all rewards.</li>
                <li>Searchera's decision on referral qualification and reward eligibility is final.</li>
                <li>This programme is governed by the laws of England and Wales. Disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</li>
                <li>By participating, you confirm you have read, understood, and agree to these terms.</li>
              </ul>
            </div>

            <p className="text-[10px] text-muted-foreground/60 pt-1">Last updated: 4 April 2026 · Searchera Ltd, Cardiff, United Kingdom</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralProgram;
