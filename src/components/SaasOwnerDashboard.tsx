import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, Users, TrendingUp, TrendingDown, RefreshCw,
  Loader2, Crown, AlertTriangle, BarChart3, Download,
  Calendar, Mail, CreditCard
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface SaasData {
  mrr: number;
  arr: number;
  active_subscriptions: number;
  churn_rate: number;
  ltv: number;
  recent_canceled: number;
  plan_breakdown: { name: string; count: number; mrr: number }[];
  growth_data: { month: string; newSubs: number; canceled: number }[];
  subscribers: {
    id: string;
    customer_email: string | null;
    customer_name: string | null;
    status: string;
    plan: string;
    amount: number;
    interval: string;
    current_period_end: string;
    created: string;
    cancel_at_period_end: boolean;
  }[];
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"];

export default function SaasOwnerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<SaasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("saas-analytics");
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-sm text-destructive font-medium">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} className="mt-4">
          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-foreground">SaaS Owner Dashboard</h2>
          <Badge variant="outline" className="text-[10px]">ADMIN ONLY</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(data)}>
            <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="MRR"
          value={`$${data.mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="h-4 w-4" />}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
        <KpiCard
          title="ARR"
          value={`$${data.arr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <KpiCard
          title="Active Subscriptions"
          value={data.active_subscriptions.toString()}
          icon={<Users className="h-4 w-4" />}
          color="text-violet-400"
          bgColor="bg-violet-500/10"
        />
        <KpiCard
          title="Churn Rate (30d)"
          value={`${data.churn_rate}%`}
          icon={<TrendingDown className="h-4 w-4" />}
          color={data.churn_rate > 5 ? "text-red-400" : "text-emerald-400"}
          bgColor={data.churn_rate > 5 ? "bg-red-500/10" : "bg-emerald-500/10"}
        />
        <KpiCard
          title="Customer LTV"
          value={`$${data.ltv.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={<CreditCard className="h-4 w-4" />}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="border-border/50 bg-card/70 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Subscription Growth (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.growth_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="newSubs" name="New" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="canceled" name="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card className="border-border/50 bg-card/70 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Revenue by Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.plan_breakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                No subscription data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.plan_breakdown}
                    dataKey="mrr"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    label={({ name, mrr }) => `${name}: $${mrr.toFixed(0)}`}
                    labelLine={false}
                  >
                    {data.plan_breakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscriber Table */}
      <Card className="border-border/50 bg-card/70 backdrop-blur-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Active Subscribers ({data.subscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No subscribers yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Customer</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Plan</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Since</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Renews</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground text-xs">{sub.customer_name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{sub.customer_email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {sub.plan.replace("prod_", "").slice(0, 12)}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-xs">
                        ${sub.amount}/{sub.interval}
                      </td>
                      <td className="py-2.5 px-3">
                        {sub.cancel_at_period_end ? (
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">Cancelling</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Active</Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(sub.created).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        {new Date(sub.current_period_end).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, icon, color, bgColor }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="border-border/50 bg-card/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bgColor}`}>
            <span className={color}>{icon}</span>
          </div>
        </div>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
