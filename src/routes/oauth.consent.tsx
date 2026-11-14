import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type Details = { client: { name: string }; redirect_uri: string; scope?: string };

export const Route = createFileRoute("/oauth/consent")({
  validateSearch: (search: Record<string, unknown>) => ({ authorization_id: typeof search["authorization_id"] === "string" ? search["authorization_id"] : undefined }),
  head: () => ({ meta: [{ title: "Authorize connector — Justdial" }, { name: "robots", content: "noindex" }] }),
  component: ConsentPage,
});

function ConsentPage() {
  const { authorization_id: fromSearch } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const [details, setDetails] = useState<Details>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = fromSearch || (typeof window !== "undefined" ? sessionStorage.getItem("mcpAuthorizationId") : null);

  useEffect(() => {
    if (!id) { setError("Missing authorization request. Please start from your MCP client."); return; }
    sessionStorage.setItem("mcpAuthorizationId", id);
    if (authLoading) return;
    if (!user) {
      window.location.replace("/auth?redirect=%2Foauth%2Fconsent");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: admin, error: roleError } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (cancelled) return;
      if (roleError || !admin) { setError("Only an approved site admin can authorize this connector."); return; }
      const response = await supabase.auth.oauth.getAuthorizationDetails(id);
      if (cancelled) return;
      if (response.error || !response.data) { setError(response.error?.message ?? "Authorization request expired or invalid."); return; }
      if ("redirect_url" in response.data && !("authorization_id" in response.data)) {
        sessionStorage.removeItem("mcpAuthorizationId");
        window.location.assign(response.data.redirect_url);
        return;
      }
      setDetails(response.data as Details);
    })().catch(() => { if (!cancelled) setError("Could not load the authorization request."); });
    return () => { cancelled = true; };
  }, [id, user, authLoading]);

  const decide = async (approve: boolean) => {
    if (!id) return;
    setBusy(true); setError("");
    try {
      const response = approve ? await supabase.auth.oauth.approveAuthorization(id) : await supabase.auth.oauth.denyAuthorization(id);
      if (response.error) throw response.error;
      sessionStorage.removeItem("mcpAuthorizationId");
      window.location.assign(response.data.redirect_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete authorization.");
      setBusy(false);
    }
  };

  return <div className="container-page grid min-h-[65vh] place-items-center py-12">
    <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-lift sm:p-8">
      <LockKeyhole className="mb-4 size-9 text-primary" />
      <h1 className="font-display text-2xl font-extrabold">Authorize MCP access</h1>
      {error ? <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</div> :
        !details ? <p className="mt-4 text-sm text-muted-foreground">Loading secure authorization request…</p> : <>
          <p className="mt-4 text-sm"><strong>{details.client.name}</strong> wants to connect to the Justdial directory through your administrator account.</p>
          <div className="mt-5 space-y-3 rounded-xl border bg-muted p-4 text-sm">
            <p><strong>Client callback:</strong> <span className="break-all">{details.redirect_uri}</span></p>
            <p><strong>Requested identity scopes:</strong> {details.scope || "Not specified"}</p>
            <p><strong>Directory access:</strong> The connected client will be able to read admin data and propose new business, product and service drafts. Your admin privileges apply.</p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Approve only if you recognize this client and trust it with your directory records. You can revoke access in Supabase.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" disabled={busy} className="rounded-xl border px-5 py-3 text-sm font-bold disabled:opacity-50" onClick={() => decide(false)}>Deny</button>
            <button type="button" disabled={busy} className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => decide(true)}>{busy ? "Please wait…" : "Allow access"}</button>
          </div>
        </>}
    </div>
  </div>;
}
