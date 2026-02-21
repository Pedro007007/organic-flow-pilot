import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search, Users, Mail, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DanielaLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

const ALLOWED_EMAIL = "pedro.acn@consultant.com";

const DanielaLeads = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<DanielaLead[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);

  const isAllowed = user?.email === ALLOWED_EMAIL;

  useEffect(() => {
    if (!loading && (!user || !isAllowed)) {
      navigate("/");
    }
  }, [user, loading, isAllowed, navigate]);

  useEffect(() => {
    if (!isAllowed) return;
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("daniela_leads" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setLeads(data as any);
      setFetching(false);
    };
    fetchLeads();
  }, [isAllowed]);

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search)
  );

  const exportCSV = () => {
    const header = "Name,Email,Phone,Date\n";
    const rows = filtered.map(l =>
      `"${l.name}","${l.email}","${l.phone}","${new Date(l.created_at).toLocaleDateString()}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daniela-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("daniela_leads" as any).delete().eq("id", id);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success("Lead deleted");
    }
  };

  if (loading || !isAllowed) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black">Daniela Chatbot Leads</h1>
              <p className="text-gray-400 text-sm">{leads.length} total leads collected</p>
            </div>
          </div>
          <Button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Users, label: "Total Leads", value: leads.length, color: "text-blue-400" },
            { icon: Mail, label: "Today", value: leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: "text-emerald-400" },
            { icon: Phone, label: "This Week", value: leads.filter(l => Date.now() - new Date(l.created_at).getTime() < 7 * 86400000).length, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No leads yet</td></tr>
              ) : (
                filtered.map(lead => (
                  <tr key={lead.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{lead.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{lead.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteLead(lead.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DanielaLeads;
