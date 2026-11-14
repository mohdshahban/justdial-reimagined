import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Building2, Cable, Inbox, LayoutDashboard, Package, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashShell } from "@/components/dash/shell";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Admin — Justdial" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <DashShell label="Admin" nav={[
      { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { to: "/admin/businesses", label: "Businesses", icon: Building2 },
      { to: "/admin/products", label: "Products & services", icon: Package },
      { to: "/admin/leads", label: "Leads", icon: Inbox },
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/mcp", label: "MCP Connector", icon: Cable },
    ]}><Outlet /></DashShell>
  ),
});
