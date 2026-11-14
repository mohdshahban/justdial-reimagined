import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { myBusinessesQ } from "@/lib/owner-data";
import { getCategory } from "@/data/catalog";
import { BusinessForm, type ListingPrefill } from "@/components/dash/business-form";
import { Empty, PageTitle, Pill } from "@/components/dash/shell";
import { Btn } from "@/components/site/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type S = { new?: boolean | undefined };
export const Route = createFileRoute("/_authenticated/dashboard/businesses")({
  head: () => ({ meta: [
    { title: "My listings & AI profile assistant — Justdial" },
    { name: "description", content: "Manage your Justdial business listings and prepare polished descriptions with tailored AI profile suggestions." },
    { property: "og:title", content: "My listings & AI profile assistant — Justdial" },
    { property: "og:description", content: "Manage business details and review AI-written listing descriptions." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  validateSearch: (s: Record<string, unknown>): S => ({ new: s["new"] === true || s["new"] === "true" ? true : undefined }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myBusinessesQ(context.user.id)),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const search = Route.useSearch();
  const nav = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(myBusinessesQ(user.id));
  const [editing, setEditing] = useState<Tables<"businesses"> | undefined>();
  const [prefill, setPrefill] = useState<ListingPrefill>();
  useEffect(() => {
    if (!search.new) return;
    try {
      const raw = sessionStorage.getItem("business-onboarding-v1");
      if (raw) {
        const data = JSON.parse(raw) as ListingPrefill;
        if (data.name && data.phone && data.city && data.cat) setPrefill(data);
      }
    } catch { /* Storage may be unavailable; form still opens. */ }
  }, [search.new]);
  const open = !!search.new || !!editing;
  const close = () => { setEditing(undefined); nav({ search: {} }); };
  const onSaved = () => { if (!editing) { try { sessionStorage.removeItem("business-onboarding-v1"); } catch { /* ignore */ } setPrefill(undefined); } close(); };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This also removes its leads and reviews.`)) return;
    const { error } = await supabase.from("businesses").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Listing deleted"); qc.invalidateQueries(); }
  };

  return (
    <>
      <PageTitle title="My listings" sub="Edits to live listings show up right away." action={<Btn onClick={() => nav({ search: { new: true } })}><Plus className="size-4" />Add listing</Btn>} />
      {data.length === 0 ? <Empty title="No listings yet" sub="Add your business to start getting customers." /> : (
        <div className="space-y-3">{data.map((b) => (
          <div key={b.id} className="flex flex-col gap-4 rounded-3xl border bg-card p-5 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{b.name}</h3><Pill v={b.status} /><Pill v={b.plan} />{b.verified && <span className="inline-flex items-center gap-1 text-xs font-bold text-success"><BadgeCheck className="size-4" />Verified</span>}</div>
              <p className="mt-1 text-sm text-muted-foreground">{getCategory(b.category)?.name}{b.sub && ` · ${b.sub}`} · {b.area}, {b.city} · {b.phone}</p>
              {b.admin_note && <p className="mt-1 text-sm text-coral">Note: {b.admin_note}</p>}
            </div>
            <div className="flex gap-2">
              {b.status === "approved" && <Link to="/business/$id" params={{ id: b.id }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold hover:bg-muted"><ExternalLink className="size-4" />View</Link>}
              <Btn variant="outline" onClick={() => setEditing(b)}><Pencil className="size-4" />Edit</Btn>
              <Btn variant="ghost" aria-label="Delete" onClick={() => remove(b.id, b.name)}><Trash2 className="size-4 text-destructive" /></Btn>
            </div>
          </div>))}</div>
      )}
      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Edit listing" : "Add a listing"}</DialogTitle></DialogHeader>
          <BusinessForm key={editing?.id ?? (prefill ? `new-${prefill.name}` : "new")} initial={editing} prefill={editing ? undefined : prefill} ownerId={user.id} onDone={onSaved} />
        </DialogContent>
      </Dialog>
    </>
  );
}
