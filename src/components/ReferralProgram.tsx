import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Copy, CheckCircle2, Users, Share2, Link2,
} from "lucide-react";

const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate a deterministic referral code from user ID
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
    { milestone: "1 referral", reward: "Extended free trial (30 days)", icon: Gift },
    { milestone: "3 referrals", reward: "Priority AI agent processing", icon: Users },
    { milestone: "5 referrals", reward: "1 month Pro free", icon: Share2 },
  ];

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
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

      {/* Reward Tiers */}
      <div className="rounded-xl border border-border/50 bg-card/70 backdrop-blur-xl p-5">
        <h4 className="text-sm font-bold text-foreground mb-4">Reward Milestones</h4>
        <div className="space-y-3">
          {rewards.map((r) => (
            <div key={r.milestone} className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <r.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">{r.reward}</p>
                <p className="text-[10px] text-muted-foreground">{r.milestone}</p>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Locked
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/70 backdrop-blur-xl p-4 text-center">
          <p className="text-2xl font-black text-foreground">0</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Invited</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/70 backdrop-blur-xl p-4 text-center">
          <p className="text-2xl font-black text-foreground">0</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Signed Up</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/70 backdrop-blur-xl p-4 text-center">
          <p className="text-2xl font-black text-foreground">0</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Rewards</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralProgram;
