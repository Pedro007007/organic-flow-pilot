import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Loader2, Download, Search, Users, CalendarDays, Mail } from "lucide-react";
import { format, isToday, isThisWeek } from "date-fns";

interface LeadRow {
  id: string;
  email: string;
  created_at: string;
  viewed_at: string | null;
  scan_id: string | null;
  competitor_scans: { domain: string } | null;
}

const LeadsManagement = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("report_leads")
        .select("*, competitor_scans(domain)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setLeads((data as unknown as LeadRow[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.email.toLowerCase().includes(q) ||
        (l.competitor_scans?.domain || "").toLowerCase().includes(q)
    );
  }, [leads, search]);

  const todayCount = leads.filter((l) => isToday(new Date(l.created_at))).length;
  const weekCount = leads.filter((l) => isThisWeek(new Date(l.created_at))).length;

  const exportCsv = () => {
    const rows = [
      ["Email", "Domain", "Captured", "Viewed"],
      ...leads.map((l) => [
        l.email,
        l.competitor_scans?.domain || "",
        format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
        l.viewed_at ? format(new Date(l.viewed_at), "yyyy-MM-dd HH:mm") : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Leads", value: leads.length, icon: Users },
          { label: "This Week", value: weekCount, icon: CalendarDays },
          { label: "Today", value: todayCount, icon: Mail },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or domain…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCsv} disabled={leads.length === 0}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {leads.length === 0 ? "No leads captured yet" : "No results match your search"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {leads.length === 0
              ? "Leads will appear here when someone enters their email to view a report."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Domain</TableHead>
                <TableHead className="text-xs">Captured</TableHead>
                <TableHead className="text-xs text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-xs font-medium">{lead.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.competitor_scans?.domain || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(lead.created_at), "MMM d, yyyy · h:mm a")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={lead.viewed_at ? "default" : "secondary"} className="text-[10px]">
                      {lead.viewed_at ? "Viewed" : "New"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default LeadsManagement;
