import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Search, Filter, ArrowUpDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KeywordOpportunity } from "@/types/seo";

const intentColors: Record<string, string> = {
  informational: "bg-info/15 text-info border-info/20",
  commercial: "bg-warning/15 text-warning border-warning/20",
  transactional: "bg-success/15 text-success border-success/20",
  local: "bg-primary/15 text-primary border-primary/20",
};

const opportunityColors: Record<string, string> = {
  high: "bg-success/15 text-success border-success/20",
  medium: "bg-warning/15 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

interface KeywordTableProps {
  keywords: KeywordOpportunity[];
}

type SortKey = "keyword" | "impressions" | "position" | "ctr" | "opportunity";
type SortDir = "asc" | "desc";

const KeywordTable = ({ keywords }: KeywordTableProps) => {
  const [search, setSearch] = useState("");
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [opportunityFilter, setOpportunityFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = keywords;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((k) => k.keyword.toLowerCase().includes(q));
    }
    if (intentFilter !== "all") {
      result = result.filter((k) => k.searchIntent === intentFilter);
    }
    if (opportunityFilter !== "all") {
      result = result.filter((k) => k.opportunity === opportunityFilter);
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "keyword") cmp = a.keyword.localeCompare(b.keyword);
      else if (sortKey === "impressions") cmp = a.impressions - b.impressions;
      else if (sortKey === "position") cmp = a.position - b.position;
      else if (sortKey === "ctr") cmp = a.ctr - b.ctr;
      else if (sortKey === "opportunity") {
        const order = { high: 3, medium: 2, low: 1 };
        cmp = (order[a.opportunity] || 0) - (order[b.opportunity] || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [keywords, search, intentFilter, opportunityFilter, sortKey, sortDir]);

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKeyName)}
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortKey === sortKeyName ? "text-primary" : ""}`} />
    </button>
  );

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-md overflow-hidden">
      <div className="border-b border-border/30 px-5 py-4">
        <h2 className="text-sm font-bold text-foreground tracking-wide">Keyword Opportunities</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Ranked by opportunity score from GSC data</p>
      </div>

      {/* Filters */}
      <div className="border-b border-border px-5 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords..."
            className="pl-8 h-8 text-sm bg-background border-border"
          />
        </div>
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border">
            <Filter className="h-3 w-3 mr-1.5" />
            <SelectValue placeholder="Intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            <SelectItem value="informational">Informational</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
            <SelectItem value="local">Local</SelectItem>
          </SelectContent>
        </Select>
        <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border">
            <Filter className="h-3 w-3 mr-1.5" />
            <SelectValue placeholder="Opportunity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground">{filtered.length} results</span>
        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 ml-auto" onClick={() => {
          const csv = ["Keyword,Intent,Impressions,Position,CTR,Opportunity,Content Type", ...filtered.map(k => `"${k.keyword}","${k.searchIntent}",${k.impressions},${k.position},${k.ctr},"${k.opportunity}","${k.contentType}"`)].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "keywords.csv"; a.click(); URL.revokeObjectURL(url);
        }}>
          <Download className="h-3 w-3" /> Export
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3"><SortHeader label="Keyword" sortKeyName="keyword" /></th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Intent</th>
              <th className="px-3 py-3 text-right"><SortHeader label="Impressions" sortKeyName="impressions" /></th>
              <th className="px-3 py-3 text-right"><SortHeader label="Position" sortKeyName="position" /></th>
              <th className="px-3 py-3 text-right"><SortHeader label="CTR" sortKeyName="ctr" /></th>
              <th className="px-5 py-3"><SortHeader label="Opportunity" sortKeyName="opportunity" /></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((kw) => (
              <tr key={kw.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-foreground">{kw.keyword}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{kw.contentType}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${intentColors[kw.searchIntent]}`}>
                    {kw.searchIntent}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-foreground">
                  {kw.impressions.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-mono text-sm text-foreground">{kw.position}</span>
                    {kw.position <= 10 ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : kw.position <= 20 ? (
                      <Minus className="h-3 w-3 text-warning" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-foreground">
                  {kw.ctr}%
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${opportunityColors[kw.opportunity]}`}>
                    {kw.opportunity}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No keywords match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeywordTable;
