import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import searcheraLogo from "@/assets/searchera-logo.png";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";

interface SidebarNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, gradient: "from-purple-500/20 via-pink-400/15 to-blue-400/20", border: "border-purple-400/30" },
  { id: "keywords", label: "Keywords", icon: Search, gradient: "from-amber-400/20 via-orange-300/15 to-yellow-300/20", border: "border-amber-400/30" },
  { id: "content", label: "Content", icon: FileText, gradient: "from-emerald-500/20 via-teal-400/15 to-cyan-400/20", border: "border-emerald-400/30" },
  { id: "rankings", label: "Rankings", icon: TrendingUp, gradient: "from-blue-500/20 via-indigo-400/15 to-violet-400/20", border: "border-blue-400/30" },
  { id: "llm-search", label: "LLM Search", icon: Sparkles, gradient: "from-rose-500/20 via-pink-400/15 to-fuchsia-400/20", border: "border-rose-400/30" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, gradient: "from-sky-500/20 via-cyan-400/15 to-teal-400/20", border: "border-sky-400/30" },
  { id: "agents", label: "Agents", icon: Bot, gradient: "from-purple-500/20 via-pink-400/15 to-blue-400/20", border: "border-purple-400/30" },
  { id: "analytics", label: "Analytics", icon: BarChart3, gradient: "from-amber-400/20 via-orange-300/15 to-yellow-300/20", border: "border-amber-400/30" },
  { id: "scanner", label: "Scanner", icon: Globe, gradient: "from-emerald-500/20 via-teal-400/15 to-cyan-400/20", border: "border-emerald-400/30" },
  { id: "reports", label: "Reports", icon: FileBarChart, gradient: "from-blue-500/20 via-indigo-400/15 to-violet-400/20", border: "border-blue-400/30" },
  { id: "leads", label: "Leads", icon: Users, gradient: "from-rose-500/20 via-pink-400/15 to-fuchsia-400/20", border: "border-rose-400/30" },
  { id: "checklist", label: "Checklist", icon: ListChecks, gradient: "from-sky-500/20 via-cyan-400/15 to-teal-400/20", border: "border-sky-400/30" },
  { id: "brands", label: "Brands", icon: Tag, gradient: "from-purple-500/20 via-pink-400/15 to-blue-400/20", border: "border-purple-400/30" },
  { id: "team", label: "Team", icon: Users, gradient: "from-amber-400/20 via-orange-300/15 to-yellow-300/20", border: "border-amber-400/30" },
  { id: "settings", label: "Settings", icon: Settings, gradient: "from-emerald-500/20 via-teal-400/15 to-cyan-400/20", border: "border-emerald-400/30" },
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
  if (user?.email !== "pedro.acn@consultant.com") return null;
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

function SidebarContent({ activeSection, onNavigate }: SidebarNavProps) {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <img src={searcheraLogo} alt="Searchera" className="h-7 w-7 rounded-md object-contain" />
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-tight">Searchera</h1>
          <p className="text-[10px] text-muted-foreground font-medium">AI SEO Growth Engine</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `bg-gradient-to-r ${item.gradient} ${item.border} text-foreground shadow-sm`
                  : `border-transparent text-sidebar-foreground hover:border-border hover:bg-muted/40 hover:text-foreground`
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-3 space-y-3">
        <GuideButton />
        <ChatbotLeadsButton />
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <div className="rounded-md bg-muted/50 px-3 py-2">
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
              <SidebarContent activeSection={activeSection} onNavigate={handleNavigate} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border/40 bg-sidebar/80 backdrop-blur-xl">
      <SidebarContent activeSection={activeSection} onNavigate={onNavigate} />
    </aside>
  );
};

export default SidebarNav;
