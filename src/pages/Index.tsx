import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import MetricCard from "@/components/MetricCard";
import AgentPipeline from "@/components/AgentPipeline";
import KeywordTable from "@/components/KeywordTable";
import ContentPipeline from "@/components/ContentPipeline";
import { mockMetrics, mockAgents, mockKeywords, mockContent } from "@/data/mockData";
import { Activity } from "lucide-react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav activeSection={activeSection} onNavigate={setActiveSection} />
      <main className="ml-56 flex-1 px-6 py-6">
        {/* Header */}
        <div className="mb-6">
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
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time data from your AI SEO growth engine
          </p>
        </div>

        {/* Dashboard view */}
        {activeSection === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockMetrics.map((metric, i) => (
                <MetricCard key={metric.label} metric={metric} index={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <AgentPipeline agents={mockAgents} />
              </div>
              <div className="lg:col-span-2">
                <ContentPipeline content={mockContent} />
              </div>
            </div>
            <KeywordTable keywords={mockKeywords} />
          </div>
        )}

        {activeSection === "keywords" && (
          <KeywordTable keywords={mockKeywords} />
        )}

        {activeSection === "content" && (
          <ContentPipeline content={mockContent} />
        )}

        {activeSection === "agents" && (
          <AgentPipeline agents={mockAgents} />
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
