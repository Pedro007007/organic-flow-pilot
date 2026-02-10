import {
  Search,
  LayoutDashboard,
  FileText,
  Bot,
  BarChart3,
  Settings,
  Zap,
  CalendarDays,
} from "lucide-react";

interface SidebarNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "keywords", label: "Keywords", icon: Search },
  { id: "content", label: "Content", icon: FileText },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const SidebarNav = ({ activeSection, onNavigate }: SidebarNavProps) => {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-tight">SEO Engine</h1>
          <p className="text-[10px] text-muted-foreground">AI-Powered Growth</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-3">
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs text-success font-medium">Agents Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
