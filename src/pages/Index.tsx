import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import MetricCard from "@/components/MetricCard";
import AgentPipeline from "@/components/AgentPipeline";
import KeywordTable from "@/components/KeywordTable";
import ContentPipeline from "@/components/ContentPipeline";
import ContentDetail from "@/components/ContentDetail";
import ContentCalendar from "@/components/ContentCalendar";
import SettingsPage from "@/components/SettingsPage";
import TeamManagement from "@/components/TeamManagement";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import NotificationBell from "@/components/NotificationBell";
import RankingsTracker from "@/components/RankingsTracker";
import BusinessScanner from "@/components/BusinessScanner";
import SeoChecklist from "@/components/SeoChecklist";
import ReportSettings from "@/components/ReportSettings";
import LeadsManagement from "@/components/LeadsManagement";
import BrandManagement from "@/components/BrandManagement";
import LlmSearchLab from "@/components/LlmSearchLab";
import { usePerformanceMetrics, useKeywords, useContentItems, useAgentRuns } from "@/hooks/useDashboardData";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useIsMobile } from "@/hooks/use-mobile";

import { Activity, Loader2, Zap, FileText, Search, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

  const { data: metrics, isLoading: metricsLoading } = usePerformanceMetrics();
  const { data: keywords, isLoading: keywordsLoading } = useKeywords();
  const { data: content, isLoading: contentLoading } = useContentItems();
  const { data: agents, isLoading: agentsLoading } = useAgentRuns();

  const displayMetrics = metrics || [];
  const displayKeywords = keywords || [];
  const displayContent = content || [];
  const displayAgents = agents || [];

  const isLoading = metricsLoading || keywordsLoading || contentLoading || agentsLoading;
  const hasRealContent = (content?.length || 0) > 0;

  useRealtimeSubscription();

  const handleSelectContent = (id: string) => {
    setSelectedContentId(id);
    setActiveSection("content-detail");
  };

  const handleBackFromDetail = () => {
    setSelectedContentId(null);
    setActiveSection("content");
  };

  const sectionTitles: Record<string, string> = {
    dashboard: "Performance Overview",
    keywords: "Keyword Opportunities",
    content: "Content Pipeline",
    agents: "Agent Pipeline",
    analytics: "Analytics",
    team: "Team Management",
    settings: "Settings",
    calendar: "Content Calendar",
    rankings: "AI SEO & Rankings",
    "llm-search": "LLM Search Lab",
    scanner: "Business Scanner",
    reports: "Reports",
    leads: "Lead Capture",
    checklist: "SEO Checklist",
    brands: "Brand Management",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav activeSection={activeSection === "content-detail" ? "content" : activeSection} onNavigate={(s) => { setActiveSection(s); setSelectedContentId(null); }} />
      <main className={`flex-1 px-4 py-6 ${isMobile ? "pt-14" : "ml-56"} sm:px-6`}>
        {/* Header */}
        {activeSection !== "content-detail" && (
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  {sectionTitles[activeSection] || ""}
                </h1>
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time data from your AI SEO growth engine
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={signOut}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Content Detail View */}
        {activeSection === "content-detail" && selectedContentId && (
          <ContentDetail contentId={selectedContentId} onBack={handleBackFromDetail} />
        )}

        {/* Dashboard view */}
        {activeSection === "dashboard" && (
          <div className="space-y-6">
            {/* Welcome card for new users */}
            {!hasRealContent && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Welcome to Searchera!</h2>
                    <p className="text-xs text-muted-foreground">Get started by creating your first content piece or running keyword discovery.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button onClick={() => setActiveSection("content")} className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Create Content</p>
                      <p className="text-[10px] text-muted-foreground">Write your first article</p>
                    </div>
                  </button>
                  <button onClick={() => setActiveSection("keywords")} className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                    <Search className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Discover Keywords</p>
                      <p className="text-[10px] text-muted-foreground">Find ranking opportunities</p>
                    </div>
                  </button>
                  <button onClick={() => setActiveSection("agents")} className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                    <Bot className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Run Agents</p>
                      <p className="text-[10px] text-muted-foreground">Automate your pipeline</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {displayMetrics.map((metric, i) => (
                <MetricCard key={metric.label} metric={metric} index={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <AgentPipeline agents={displayAgents} />
              </div>
              <div className="lg:col-span-2">
                <ContentPipeline content={displayContent} onSelectItem={handleSelectContent} />
              </div>
            </div>
            <KeywordTable keywords={displayKeywords} />
          </div>
        )}

        {activeSection === "keywords" && (
          <KeywordTable keywords={displayKeywords} />
        )}

        {activeSection === "content" && (
          <ContentPipeline content={displayContent} onSelectItem={handleSelectContent} />
        )}

        {activeSection === "agents" && (
          <AgentPipeline agents={displayAgents} />
        )}

        {activeSection === "calendar" && (
          <ContentCalendar content={displayContent} onSelectItem={handleSelectContent} />
        )}

        {activeSection === "analytics" && <AnalyticsDashboard />}

        {activeSection === "team" && <TeamManagement />}

        {activeSection === "settings" && <SettingsPage />}

        {activeSection === "rankings" && <RankingsTracker />}

        {activeSection === "llm-search" && <LlmSearchLab />}

        {activeSection === "scanner" && <BusinessScanner />}

        {activeSection === "reports" && <ReportSettings />}

        {activeSection === "leads" && <LeadsManagement />}

        {activeSection === "checklist" && <SeoChecklist />}

        {activeSection === "brands" && <BrandManagement />}
      </main>
    </div>
  );
};

export default Index;
