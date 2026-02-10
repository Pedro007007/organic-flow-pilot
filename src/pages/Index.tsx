import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import MetricCard from "@/components/MetricCard";
import AgentPipeline from "@/components/AgentPipeline";
import KeywordTable from "@/components/KeywordTable";
import ContentPipeline from "@/components/ContentPipeline";
import ContentDetail from "@/components/ContentDetail";
import { usePerformanceMetrics, useKeywords, useContentItems, useAgentRuns } from "@/hooks/useDashboardData";
import { mockMetrics, mockAgents, mockKeywords, mockContent } from "@/data/mockData";
import { Activity, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const { signOut } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = usePerformanceMetrics();
  const { data: keywords, isLoading: keywordsLoading } = useKeywords();
  const { data: content, isLoading: contentLoading } = useContentItems();
  const { data: agents, isLoading: agentsLoading } = useAgentRuns();

  const displayMetrics = metrics?.length ? metrics : mockMetrics;
  const displayKeywords = keywords?.length ? keywords : mockKeywords;
  const displayContent = content?.length ? content : mockContent;
  const displayAgents = agents?.length ? agents : mockAgents;

  const isLoading = metricsLoading || keywordsLoading || contentLoading || agentsLoading;

  const handleSelectContent = (id: string) => {
    setSelectedContentId(id);
    setActiveSection("content-detail");
  };

  const handleBackFromDetail = () => {
    setSelectedContentId(null);
    setActiveSection("content");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav activeSection={activeSection === "content-detail" ? "content" : activeSection} onNavigate={(s) => { setActiveSection(s); setSelectedContentId(null); }} />
      <main className="ml-56 flex-1 px-6 py-6">
        {/* Header */}
        {activeSection !== "content-detail" && (
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {activeSection === "dashboard" && "Performance Overview"}
                  {activeSection === "keywords" && "Keyword Opportunities"}
                  {activeSection === "content" && "Content Pipeline"}
                  {activeSection === "agents" && "Agent Pipeline"}
                  {activeSection === "analytics" && "Analytics"}
                  {activeSection === "settings" && "Settings"}
                </h1>
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time data from your AI SEO growth engine
              </p>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        )}

        {/* Content Detail View */}
        {activeSection === "content-detail" && selectedContentId && (
          <ContentDetail contentId={selectedContentId} onBack={handleBackFromDetail} />
        )}

        {/* Dashboard view */}
        {activeSection === "dashboard" && (
          <div className="space-y-6">
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

        {activeSection === "analytics" && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Analytics deep-dive coming soon — connect GSC to unlock.</p>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Configure API keys, agent schedules, and publishing targets.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
