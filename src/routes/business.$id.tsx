import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, BadgeCheck, Bookmark, Clock, MapPin, MessageCircle, Navigation, Phone, Share2, ShieldCheck, Star, PenLine, ChevronRight, Image as ImageIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getCategory, type Business } from "@/data/catalog";
import { useQuery } from "@tanstack/react-query";
import { liveBusinessQ, liveBusinessesQ } from "@/lib/public-data";
import { EnquiryForm, MiniBusinessCard, RatingBadge, btnClass } from "@/components/site/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessOfferings } from "@/components/site/business-offerings";
import { EnquiryPopup } from "@/components/site/enquiry-popup";
import { directionsUrl, phoneHref, whatsappUrl } from "@/lib/discovery";

export const Route = createFileRoute("/business/$id")({
  loader: async ({ params, context }) => ({ b: /^[0-9a-f-]{36}$/.test(params.id) ? await context.queryClient.ensureQueryData(liveBusinessQ(params.id)).catch(() => null) : null }),
  head: ({ loaderData }) => {
    const b = loaderData?.b;
    const t = b ? `${b.name}, ${b.area} ${b.city} — Reviews & Contact | Justdial` : "Business — Justdial";
    const d = b
      ? `${b.name} in ${b.area}, ${b.city}. ${b.reviews ? `Rated ${b.rating}/5 based on ${b.reviews} customer reviews. ` : "Explore this newly listed business. "}See services, contact details and send an enquiry.`
      : "Explore local business information and contact details.";
    return { meta: [
      { title: t }, { name: "description", content: d },
      { property: "og:title", content: t }, { property: "og:description", content: d },
      { property: "og:type", content: "business.business" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: BusinessPage,
});

function BusinessPage() {
  const { b } = Route.useLoaderData();
  const { id } = Route.useParams();
  const isUuid = /^[0-9a-f-]{36}$/.test(id);
  const live = useQuery({ ...liveBusinessQ(id), enabled: !b && isUuid });
  if (b) return <BusinessView b={b} />;
  if (isUuid && live.isLoading) return <div className="container-page py-24 text-center text-muted-foreground">Loading…</div>;
  if (live.data) return <BusinessView b={live.data} />;
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-extrabold">This business isn't available</h1>
      <p className="mt-2 text-muted-foreground">It may have been removed or is still waiting for approval.</p>
      <Link to="/categories" className={`${btnClass("primary")} mt-6`}>Browse categories</Link>
    </div>
  );
}

function BusinessView({ b }: { b: Business }) {
  const cat = getCategory(b.category);
  const { data: all = [] } = useQuery(liveBusinessesQ);
  const similar = all.filter((x) => x.category === b.category && x.id !== b.id && x.city === b.city).slice(0, 12);
  const pics = b.gallery ?? [];
  const wa = whatsappUrl(b.whatsapp);
  const call = phoneHref(b.phone);
  const website = b.website && /^https?:\/\//i.test(b.website) ? b.website : undefined;
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try { setSaved((JSON.parse(localStorage.getItem("saved-businesses-v1") || "[]") as string[]).includes(b.id)); }
    catch { setSaved(false); }
  }, [b.id]);
  const toggleSave = () => {
    try {
      const current = JSON.parse(localStorage.getItem("saved-businesses-v1") || "[]") as string[];
      const next = saved ? current.filter((id) => id !== b.id) : [...new Set([...current, b.id])];
      localStorage.setItem("saved-businesses-v1", JSON.stringify(next)); setSaved(!saved);
      toast.success(saved ? "Removed from saved businesses" : "Saved on this device");
    } catch { toast.error("Saving isn't available in this browser."); }
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: b.name, url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); toast.success("Listing link copied"); }
      else toast.error("Sharing is unavailable. Copy the page URL from your browser.");
    } catch (error) { if ((error as Error).name !== "AbortError") toast.error("Couldn't share this listing."); }
  };
  const dist = [5, 4, 3, 2, 1].map((n) => (b.reviewList.length ? Math.round((b.reviewList.filter((r) => r.rating === n).length / b.reviewList.length) * 100) : 0));
  const landmark = b.landmark?.trim() && b.landmark.trim().toLowerCase() !== b.address?.trim().toLowerCase() ? b.landmark.trim() : "";
  return (
    <div className="container-page pt-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"><Link to="/" className="hover:underline">Home</Link><ChevronRight className="size-4" /><Link to="/category/$slug" params={{ slug: b.category }} className="hover:underline">{cat?.name}</Link><ChevronRight className="size-4" /><span className="text-foreground">{b.name}</span></nav>

      <div className="relative mt-4 grid h-64 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[2rem] md:h-96">
        <img src={pics[0] ?? b.image} alt={pics.length ? `${b.name} business photo` : `${cat?.name ?? "Business"} category illustration`} width={944} height={704} className={`col-span-4 row-span-2 size-full object-cover ${pics.length > 1 ? "md:col-span-2" : ""}`} />
        {pics.slice(1, 5).map((src, i) => <img key={src} src={src} alt={`${b.name} photo ${i + 2}`} loading="lazy" className="hidden size-full object-cover md:block" />)}
        {!pics.length && <span className="absolute bottom-4 left-4 rounded-lg bg-ink/85 px-3 py-1.5 text-xs font-semibold text-ink-foreground">Photo pending · Category placeholder</span>}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {b.logo && <img src={b.logo} alt={`${b.name} logo`} className="size-12 rounded-xl border object-cover" />}
            <h1 className="text-3xl font-extrabold md:text-4xl">{b.name}</h1>
            {b.verified && <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success"><BadgeCheck className="size-4" />Verified</span>}
            {b.trust && <span className="inline-flex items-center gap-1 rounded-full bg-saffron-soft px-2.5 py-1 text-xs font-bold"><ShieldCheck className="size-4" />Trust</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <RatingBadge rating={b.rating} /><span className="font-semibold">{b.reviews.toLocaleString("en-IN")} ratings</span>
            <span className="text-muted-foreground">{cat?.name} · {b.sub}{b.years > 0 && ` · ${b.years} yrs in business`}</span>
          </div>
          <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin className="size-4" />{b.address || `${b.area}, ${b.city}`}{landmark ? ` · ${landmark}` : ""}</span>
            <span className="flex items-center gap-2"><Clock className="size-4" />{b.hours || "Contact business for opening hours"}{b.days?.length ? ` · ${b.days.length === 7 ? "All days" : b.days.join(", ")}` : ""}</span>
            {b.openKnown && <span className={`text-sm font-semibold ${b.open ? "text-success" : "text-muted-foreground"}`}>{b.open ? "Open now" : "Currently closed"} · Based on listed hours</span>}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {b.live && <EnquiryPopup context={{ businessId: b.id, businessName: b.name, title: b.sub || b.name, image: b.image, location: `${b.area}, ${b.city}`, price: b.price, description: b.description }} />}
            {call && <a href={call} className={btnClass("ink")}><Phone className="size-4" />{b.phone}</a>}
            <Link to="/write-review" search={{ b: b.id }} className={btnClass("outline")}><PenLine className="size-4" />Review</Link>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className={btnClass("outline")}><MessageCircle className="size-4" />WhatsApp</a>}
            {website && <a href={website} target="_blank" rel="noreferrer" className={btnClass("outline")}><Globe className="size-4" />Website</a>}
            <a href={directionsUrl(`${b.address || b.area}, ${b.city}, India`, b.coords)} target="_blank" rel="noreferrer" className={btnClass("outline")}><Navigation className="size-4" />Directions</a>
            <button onClick={share} className={btnClass("outline")}><Share2 className="size-4" />Share</button>
            <button onClick={toggleSave} aria-pressed={saved} className={btnClass("outline")}>{saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}{saved ? "Saved" : "Save"}</button>
          </div>

          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="h-auto flex-wrap rounded-2xl p-1">
              {["overview", "catalog", "services", "photos", "reviews", "qa"].map((t) => <TabsTrigger key={t} value={t} className="rounded-xl px-4 py-2 capitalize">{t === "qa" ? "Info" : t === "catalog" ? "Products & services" : t}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="overview" className="mt-6 space-y-4">
              <p className="leading-relaxed">{b.description || `${b.name} is listed under ${cat?.name ?? "local businesses"} in ${b.area}, ${b.city}. Contact the business to confirm available services and current details.`}</p>
              <div className="flex flex-wrap gap-2">{b.tags.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{t}</span>)}</div>
              {b.price && <p className="text-sm"><span className="font-bold">Price:</span> {b.price}</p>}
              {!!b.payments?.length && <p className="text-sm"><span className="font-bold">Payments:</span> {b.payments.join(", ")}</p>}
            </TabsContent>
            <TabsContent value="services" className="mt-6">
              <ul className="divide-y rounded-3xl border bg-card">{b.services.length === 0 && <li className="p-4 text-sm text-muted-foreground">Call or send an enquiry for prices.</li>}{b.services.map((s) => <li key={s.name} className="flex items-center justify-between p-4"><span className="font-semibold">{s.name}</span><span className="font-bold">{s.price}</span></li>)}</ul>
            </TabsContent>
            <TabsContent value="catalog" className="mt-6"><BusinessOfferings businessId={b.id} businessName={b.name} businessImage={b.image} location={`${b.area}, ${b.city}`} /></TabsContent>
            <TabsContent value="photos" className="mt-6">
              {pics.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{pics.map((src, i) => <a key={src} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border"><img src={src} alt={`${b.name} photo ${i + 1}`} loading="lazy" className="aspect-[4/3] size-full object-cover transition hover:scale-105" /></a>)}</div> : <div className="rounded-3xl border border-dashed bg-muted p-8 text-center"><ImageIcon className="mx-auto size-8 text-muted-foreground" /><p className="mt-2 font-semibold">No business photos yet</p><p className="mt-1 text-sm text-muted-foreground">The image above is a category illustration, not a photo of this business.</p></div>}
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <div className="grid gap-6 rounded-3xl border bg-card p-6 sm:grid-cols-[160px_1fr]">
                <div className="text-center"><p className="font-display text-5xl font-extrabold">{b.reviews ? b.rating.toFixed(1) : "New"}</p><div className="mt-1 flex justify-center text-primary">{b.reviews > 0 && Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < Math.round(b.rating) ? "fill-current" : "text-muted"}`} />)}</div><p className="mt-1 text-xs text-muted-foreground">{b.reviews} ratings</p></div>
                <div className="space-y-1.5">{dist.map((p, i) => <div key={i} className="flex items-center gap-2 text-sm"><span className="w-3">{5 - i}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success" style={{ width: `${p}%` }} /></div><span className="w-8 text-right text-muted-foreground">{p}%</span></div>)}</div>
              </div>
              <ul className="mt-4 space-y-3">{b.reviewList.length === 0 && <li className="rounded-3xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">No reviews yet — be the first.</li>}{b.reviewList.map((r, i) => (
                <li key={i} className="rounded-3xl border bg-card p-5">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-saffron-soft font-bold">{r.name[0]}</span><div><p className="font-bold">{r.name}</p><p className="text-xs text-muted-foreground">{r.date}</p></div><RatingBadge rating={r.rating} className="ml-auto" /></div>
                  <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{r.text}</p>
                </li>))}</ul>
            </TabsContent>
            <TabsContent value="qa" className="mt-6 space-y-3">
              <dl className="divide-y rounded-3xl border bg-card">{([
                ["Address", [b.address || `${b.area}, ${b.city}`, b.pincode].filter(Boolean).join(" – ")], ["Landmark", b.landmark], ["Phone", b.phone],
                ["WhatsApp", b.whatsapp ? `+91 ${b.whatsapp}` : ""], ["Email", b.email], ["Website", b.website],
                ["Open days", b.days?.join(", ")], ["Hours", b.hours], ["Payments", b.payments?.join(", ")], ["In business", b.years > 0 ? `${b.years} years` : ""],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => <div key={k} className="grid grid-cols-[120px_1fr] gap-3 p-4 text-sm"><dt className="font-bold">{k}</dt><dd className="break-words text-muted-foreground">{v}</dd></div>)}</dl>
            </TabsContent>
          </Tabs>
          <p className="mt-8 text-sm text-muted-foreground">Own a business? <Link to="/free-listing" className="font-bold text-foreground underline">Create or manage a listing</Link></p>
        </div>
        <aside id="enquire" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"><EnquiryForm businessId={b.live ? b.id : undefined} subtitle={`Send your requirement to ${b.name}.`} /></aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-2xl font-bold">Similar businesses nearby</h2>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4">{similar.map((x) => <MiniBusinessCard key={x.id} b={x} />)}</div>
        </section>
      )}
    </div>
  );
}
