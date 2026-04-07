import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { hasFeatureAccess, getRequiredTier, getTierLabel } from "@/lib/featureGating";
import {
  Search,
  LayoutDashboard,
  FileText,
  Bot,
  BarChart3,
  Settings,
  CalendarDays,
  Menu,
  Sun,
  Moon,
  Users,
  TrendingUp,
  Globe,
  ListChecks,
  FileBarChart,
  Tag,
  Sparkles,
  MessageCircle,
  BookOpen,
  Gift,
  Lock,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import searcheraLogo from "@/assets/searchera-logo.png";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";

interface SidebarNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "llm-search", label: "Keyword Research", icon: Sparkles },
  { id: "keywords", label: "Keywords", icon: Search },
  { id: "content", label: "Content", icon: FileText },
  { id: "rankings", label: "Rankings", icon: TrendingUp },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "scanner", label: "Scanner", icon: Globe },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "leads", label: "Leads", icon: Users },
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "brands", label: "Brands", icon: Tag },
];

export const headerNavItems = [
  { id: "referrals", label: "Referrals", icon: Gift },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

function GuideButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/guide")}
      className="flex w-full items-center gap-2.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
    >
      <BookOpen className="h-4 w-4" />
      Guide A–Z
    </button>
  );
}

function ChatbotLeadsButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);
  if (!isAdmin) return null;
  return (
    <button
      onClick={() => navigate("/daniela-leads")}
      className="flex w-full items-center gap-2.5 rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-400/10 transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      Chatbot Leads
    </button>
  );
}

function SidebarContentInner({ activeSection, onNavigate }: SidebarNavProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, tier, loading: subLoading } = useSubscription();

  // Check if user is admin for SaaS dashboard access
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) return;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").limit(1)
        .then(({ data }) => setIsAdmin((data?.length || 0) > 0));
    });
  }, [user]);

  return (
    <>
      <div className="flex items-center justify-center border-b border-border/30 px-0 py-0">
        <img src={searcheraLogo} alt="Searchera" className="h-40 w-40 rounded-md object-cover" />
      </div>


      {/* Plan Badge */}
      <div className="px-3 pt-3">
        <button
          onClick={() => navigate("/pricing")}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
            subscribed && tier
              ? tier === "enterprise"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : tier === "pro"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-muted/40 text-muted-foreground border border-border/30 hover:border-primary/30 hover:text-primary"
          }`}
        >
          <Crown className="h-3.5 w-3.5" />
          {subLoading ? "..." : subscribed && tier ? `${SUBSCRIPTION_TIERS[tier].name} Plan` : "No Plan — Subscribe"}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const hasAccess = hasFeatureAccess(item.id, tier, subscribed);
          const requiredTier = getRequiredTier(item.id);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (hasAccess) {
                  onNavigate(item.id);
                } else {
                  navigate("/pricing");
                }
              }}
              className={`group flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                !hasAccess
                  ? "border-transparent text-muted-foreground/50 hover:bg-muted/20 cursor-pointer"
                  : isActive
                    ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                    : "border-transparent text-sidebar-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : !hasAccess ? 'text-muted-foreground/40' : ''}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {!hasAccess && requiredTier && (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40">{getTierLabel(requiredTier)}</span>
                </span>
              )}
            </button>
          );
        })}

        {/* Admin-only SaaS Dashboard */}
        {isAdmin && (
          <>
            <div className="my-2 border-t border-border/20" />
            <button
              onClick={() => onNavigate("saas-admin")}
              className={`group flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                activeSection === "saas-admin"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-sm"
                  : "border-transparent text-amber-500/70 hover:border-amber-500/20 hover:bg-amber-500/5 hover:text-amber-400"
              }`}
            >
              <Crown className={`h-4 w-4 ${activeSection === "saas-admin" ? "text-amber-400" : ""}`} />
              <span className="flex-1 text-left">SaaS Admin</span>
              <Badge variant="outline" className="text-[8px] px-1 py-0 border-amber-500/30 text-amber-500/70">OWNER</Badge>
            </button>
          </>
        )}
      </nav>
      <div className="border-t border-border/30 px-4 py-3 space-y-3">
        <GuideButton />
        <div className="rounded-lg bg-muted/30 backdrop-blur-sm px-3 py-2 border border-border/20">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs text-success font-medium">Agents Active</span>
          </div>
        </div>
      </div>
    </>
  );
}

const SidebarNav = ({ activeSection, onNavigate }: SidebarNavProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleNavigate = (section: string) => {
    onNavigate(section);
    setOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card md:hidden"
        >
          <Menu className="h-4 w-4 text-foreground" />
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-56 p-0 bg-sidebar border-border">
            <div className="flex h-full flex-col">
              <SidebarContentInner activeSection={activeSection} onNavigate={handleNavigate} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border/50 bg-sidebar/90 backdrop-blur-xl">
      <SidebarContentInner activeSection={activeSection} onNavigate={onNavigate} />
    </aside>
  );
};

export default SidebarNav;
