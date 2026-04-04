import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Copy, CheckCircle2, Users, Share2, Link2, Crown,
} from "lucide-react";

const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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
      {/* Referral Link Card — Floating */}
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
          <Input
            value={referralLink}
            readOnly
            className="flex-1 text-sm font-mono bg-background/50"
          />
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

      {/* Reward Tiers — Each with unique color */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3 px-1">Reward Milestones</h4>
        <div className="space-y-3">
          {rewards.map((r) => (
            <div
              key={r.milestone}
              className={`group relative overflow-hidden rounded-2xl border ${r.border} bg-gradient-to-r ${r.gradient} backdrop-blur-xl p-4 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-500`}
            >
              {/* Decorative glow */}
              <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-current opacity-[0.03] blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.iconBg} shadow-sm shrink-0`}>
                  <r.icon className={`h-4.5 w-4.5 ${r.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">{r.reward}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{r.milestone}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${r.badgeClass}`}>
                  Locked
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats — Floating cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "0", label: "Invited", gradient: "from-sky-500/8 to-blue-500/3", border: "border-sky-500/20" },
          { value: "0", label: "Signed Up", gradient: "from-violet-500/8 to-purple-500/3", border: "border-violet-500/20" },
          { value: "0", label: "Rewards", gradient: "from-rose-500/8 to-pink-500/3", border: "border-rose-500/20" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-xl p-4 text-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-500`}
          >
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferralProgram;
