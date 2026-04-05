import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, Shield, Trash2, Users, MessageCircle } from "lucide-react";

type AppRole = "admin" | "operator" | "viewer";

interface TeamMember {
  user_id: string;
  role: AppRole;
  display_name: string | null;
  avatar_url: string | null;
}

interface Invite {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  created_at: string;
}

const roleBadgeVariant: Record<AppRole, string> = {
  admin: "bg-accent/15 text-accent border-accent/30",
  operator: "bg-primary/15 text-primary border-primary/30",
  viewer: "bg-muted text-muted-foreground border-border",
};

const TeamManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("viewer");
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    // Check if current user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!roleData);

    // Load all roles + profiles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (roles) {
      const userIds = [...new Set(roles.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const memberList: TeamMember[] = userIds.map((uid) => {
        const profile = profileMap.get(uid);
        const userRoles = roles.filter((r) => r.user_id === uid);
        // Pick highest role
        const role: AppRole = userRoles.some((r) => r.role === "admin")
          ? "admin"
          : userRoles.some((r) => r.role === "operator")
          ? "operator"
          : "viewer";
        return {
          user_id: uid,
          role,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
        };
      });

      setMembers(memberList);
    }

    // Load invites (only admins can see these due to RLS)
    const { data: inviteData } = await supabase
      .from("team_invites")
      .select("*")
      .order("created_at", { ascending: false });

    setInvites((inviteData as Invite[]) || []);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setSending(true);

    const { error } = await supabase.from("team_invites").insert({
      invited_by: user.id,
      email: inviteEmail.trim(),
      role: inviteRole,
    });

    setSending(false);
    if (error) {
      toast({ title: "Invite failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invite sent", description: `Invited ${inviteEmail} as ${inviteRole}` });
      setInviteEmail("");
      loadData();
    }
  };

  const handleDeleteInvite = async (id: string) => {
    const { error } = await supabase.from("team_invites").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setInvites((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    // Delete existing roles and insert new one
    const { error: delError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (delError) {
      toast({ title: "Update failed", description: delError.message, variant: "destructive" });
      return;
    }

    const { error: insError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (insError) {
      toast({ title: "Update failed", description: insError.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Team Members */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Team Members</h3>
          <Badge variant="outline" className="ml-auto text-xs">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground uppercase">
                  {(member.display_name || "?")[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {member.display_name || "Unknown"}
                    {member.user_id === user?.id && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && member.user_id !== user?.id ? (
                  <Select
                    value={member.role}
                    onValueChange={(val) => handleChangeRole(member.user_id, val as AppRole)}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                      roleBadgeVariant[member.role]
                    }`}
                  >
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Form (admin only) */}
      {isAdmin && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Invite Team Member</h3>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                type="email"
                className="bg-background border-border text-sm"
              />
            </div>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
              <SelectTrigger className="w-28 bg-background border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleInvite} disabled={sending || !inviteEmail.trim()}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {isAdmin && invites.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Pending Invites</h3>
          </div>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3"
              >
                <div>
                  <p className="text-sm text-foreground">{invite.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {invite.status} · {invite.role} · {new Date(invite.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteInvite(invite.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
