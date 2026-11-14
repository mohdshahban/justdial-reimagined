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
    <div className="container-page max-w-[90rem] pt-5">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-[#718096]"><Link to="/" className="hover:underline">Home</Link><ChevronRight className="size-3.5" /><Link to="/category/$slug" params={{ slug: b.category }} className="hover:underline">{cat?.name}</Link><ChevronRight className="size-3.5" /><span className="text-[#435267]">{b.name}</span></nav>

      <section className="mt-4 rounded-xl border border-[#dfe5eb] bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          {b.logo && <img src={b.logo} alt={`${b.name} logo`} className="size-11 rounded-md border object-cover" />}
          <h1 className="text-[23px] font-bold leading-tight text-[#1c2b3a] md:text-[27px]">{b.name}</h1>
          {b.verified && <span className="inline-flex items-center gap-1 text-xs font-bold text-[#078347]"><BadgeCheck className="size-4" />Verified</span>}
          {b.trust && <span className="inline-flex items-center gap-1 rounded bg-[#fff5df] px-2 py-1 text-xs font-bold text-[#8b6200]"><ShieldCheck className="size-4" />Trust</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-[#526171]">
          {b.reviews > 0 ? <><RatingBadge rating={b.rating} className="rounded px-2 py-0.5 text-xs" /><span className="font-semibold">{b.reviews.toLocaleString("en-IN")} ratings</span></> : <span className="rounded bg-[#edf2f6] px-2 py-1 text-xs font-semibold">New listing</span>}
          <span>{cat?.name}{b.sub ? ` · ${b.sub}` : ""}</span>
          {b.years > 0 && <span>· {b.years} years in business</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#526171]">
          <span className="inline-flex items-start gap-1.5"><MapPin className="mt-0.5 size-4 shrink-0" />{b.address || `${b.area}, ${b.city}`}{landmark ? ` · ${landmark}` : ""}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{b.hours || "Hours not provided"}{b.openKnown && <strong className={b.open ? "text-[#078347]" : "text-[#7a8794]"}>· {b.open ? "Open now" : "Currently closed"}</strong>}</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {call && <a href={call} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#078347] px-4 py-2 text-sm font-bold text-white hover:bg-[#056b39]"><Phone className="size-4" />{b.phone}</a>}
          {b.live && <EnquiryPopup context={{ businessId: b.id, businessName: b.name, title: b.sub || b.name, image: pics.length ? b.image : undefined, location: `${b.area}, ${b.city}`, price: b.price, description: b.description }} label="Send Enquiry" buttonClassName="min-h-10 rounded-md bg-[#1673d1] px-4 text-white shadow-none hover:bg-[#095fae]" />}
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#13a36b] px-4 py-2 text-sm font-bold text-[#087f49] hover:bg-[#eaf9f2]"><MessageCircle className="size-4" />WhatsApp</a>}
          <Link to="/write-review" search={{ b: b.id }} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#dce1e6] px-3 py-2 text-sm font-semibold hover:bg-[#f4f6f8]"><PenLine className="size-4" />Rate & Review</Link>
          <button onClick={share} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#dce1e6] px-3 py-2 text-sm font-semibold hover:bg-[#f4f6f8]"><Share2 className="size-4" />Share</button>
          <button onClick={toggleSave} aria-pressed={saved} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#dce1e6] px-3 py-2 text-sm font-semibold hover:bg-[#f4f6f8]">{saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}{saved ? "Saved" : "Save"}</button>
        </div>
      </section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Tabs defaultValue="overview">
            <TabsList className="no-scrollbar flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-[#dfe5eb] bg-transparent p-0">
              {["overview", "photos", "catalog", "qa", "services", "reviews"].map((t) => <TabsTrigger key={t} value={t} className="shrink-0 rounded-none border-b-[3px] border-transparent px-3.5 py-3 text-sm font-semibold text-[#556575] shadow-none data-[state=active]:border-[#1673d1] data-[state=active]:bg-transparent data-[state=active]:text-[#1673d1] data-[state=active]:shadow-none">{t === "qa" ? "Quick Info" : t === "catalog" ? "Catalogue" : t === "overview" ? "Overview" : t === "photos" ? "Photos" : t === "services" ? "Services" : "Reviews"}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="overview" className="mt-5 space-y-5">
              <section className="rounded-xl border border-[#e0e4e9] bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Photos</h2><span className="text-xs font-medium text-[#69798a]">{pics.length ? `${pics.length} business ${pics.length === 1 ? "photo" : "photos"}` : "No photos yet"}</span></div>
                {pics.length ? <div className="grid h-40 grid-cols-3 gap-2 overflow-hidden rounded-lg sm:h-52">{pics.slice(0, 3).map((src, i) => <a key={src} href={src} target="_blank" rel="noreferrer" className="overflow-hidden bg-[#f4f6f8]"><img src={src} alt={`${b.name} photo ${i + 1}`} loading="lazy" className="size-full object-cover transition hover:scale-105" /></a>)}</div> : <div className="flex h-32 items-center justify-center gap-2 rounded-lg border border-dashed border-[#ccd5de] bg-[#f5f7fa] text-sm text-[#7a8896]"><ImageIcon className="size-5" />Actual business photos not available yet</div>}
              </section>
              <section className="rounded-xl border border-[#e0e4e9] bg-white p-4 sm:p-5">
                <h2 className="mb-3 text-lg font-bold">About {b.name}</h2>
                <p className="text-sm leading-7 text-[#415163]">{b.description || `${b.name} is listed under ${cat?.name ?? "local businesses"} in ${b.area}, ${b.city}. Contact the business to confirm available services and current details.`}</p>
                <div className="mt-4 flex flex-wrap gap-2">{b.tags.map((t) => <span key={t} className="rounded bg-[#f2f4f6] px-3 py-1 text-xs font-medium text-[#506070]">{t}</span>)}</div>
                {b.price && <p className="mt-4 text-sm"><span className="font-bold">Price:</span> {b.price}</p>}
                {!!b.payments?.length && <p className="mt-2 text-sm"><span className="font-bold">Payments:</span> {b.payments.join(", ")}</p>}
              </section>
            </TabsContent>
            <TabsContent value="services" className="mt-5">
              <ul className="divide-y rounded-xl border bg-white">{b.services.length === 0 && <li className="p-4 text-sm text-muted-foreground">Call or send an enquiry for available services and prices.</li>}{b.services.map((s) => <li key={s.name} className="flex items-center justify-between gap-3 p-4"><span className="font-semibold">{s.name}</span><span className="font-bold">{s.price}</span></li>)}</ul>
            </TabsContent>
            <TabsContent value="catalog" className="mt-5"><BusinessOfferings businessId={b.id} businessName={b.name} businessImage={b.image} location={`${b.area}, ${b.city}`} /></TabsContent>
            <TabsContent value="photos" className="mt-5">
              {pics.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{pics.map((src, i) => <a key={src} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border"><img src={src} alt={`${b.name} photo ${i + 1}`} loading="lazy" className="aspect-[4/3] size-full object-cover transition hover:scale-105" /></a>)}</div> : <div className="rounded-xl border border-dashed bg-[#f5f7fa] p-8 text-center"><ImageIcon className="mx-auto size-8 text-[#7a8896]" /><p className="mt-2 font-semibold">No business photos yet</p><p className="mt-1 text-sm text-muted-foreground">Actual photos can be added by the business owner.</p></div>}
            </TabsContent>
            <TabsContent value="reviews" className="mt-5">
              <div className="grid gap-6 rounded-xl border bg-white p-6 sm:grid-cols-[160px_1fr]">
                <div className="text-center"><p className="font-display text-5xl font-extrabold">{b.reviews ? b.rating.toFixed(1) : "New"}</p><div className="mt-1 flex justify-center text-primary">{b.reviews > 0 && Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < Math.round(b.rating) ? "fill-current" : "text-muted"}`} />)}</div><p className="mt-1 text-xs text-muted-foreground">{b.reviews} ratings</p></div>
                <div className="space-y-1.5">{dist.map((p, i) => <div key={i} className="flex items-center gap-2 text-sm"><span className="w-3">{5 - i}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success" style={{ width: `${p}%` }} /></div><span className="w-8 text-right text-muted-foreground">{p}%</span></div>)}</div>
              </div>
              <ul className="mt-4 space-y-3">{b.reviewList.length === 0 && <li className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">No reviews yet — be the first.</li>}{b.reviewList.map((r, i) => (
                <li key={i} className="rounded-xl border bg-card p-5">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-saffron-soft font-bold">{r.name[0]}</span><div><p className="font-bold">{r.name}</p><p className="text-xs text-muted-foreground">{r.date}</p></div><RatingBadge rating={r.rating} className="ml-auto" /></div>
                  <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{r.text}</p>
                </li>))}</ul>
            </TabsContent>
            <TabsContent value="qa" className="mt-5 space-y-3">
              <dl className="divide-y rounded-xl border bg-white">{([
                ["Address", [b.address || `${b.area}, ${b.city}`, b.pincode].filter(Boolean).join(" – ")], ["Landmark", b.landmark], ["Phone", b.phone],
                ["WhatsApp", b.whatsapp ? `+91 ${b.whatsapp}` : ""], ["Email", b.email], ["Website", b.website],
                ["Open days", b.days?.join(", ")], ["Hours", b.hours], ["Payments", b.payments?.join(", ")], ["In business", b.years > 0 ? `${b.years} years` : ""],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => <div key={k} className="grid grid-cols-[120px_1fr] gap-3 p-4 text-sm"><dt className="font-bold">{k}</dt><dd className="break-words text-muted-foreground">{v}</dd></div>)}</dl>
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-sm text-muted-foreground">Own a business? <Link to="/free-listing" className="font-bold text-foreground underline">Create or manage a listing</Link></p>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border border-[#dfe5eb] bg-white p-5">
            <h2 className="mb-4 text-lg font-bold">Contact & Address</h2>
            <p className="flex items-start gap-2 text-sm leading-6 text-[#4f5e6c]"><MapPin className="mt-1 size-4 shrink-0 text-[#1673d1]" />{[b.address || `${b.area}, ${b.city}`, b.pincode].filter(Boolean).join(", ")}</p>
            {landmark && <p className="mt-2 text-xs text-[#788694]">Landmark: {landmark}</p>}
            <p className="mt-4 flex items-start gap-2 text-sm text-[#4f5e6c]"><Clock className="mt-0.5 size-4 shrink-0 text-[#1673d1]" />{b.hours || "Opening hours not listed"}</p>
            {b.days?.length > 0 && <p className="ml-6 mt-1 text-xs text-[#788694]">{b.days.length === 7 ? "Open all days" : b.days.join(", ")}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={directionsUrl(`${b.address || b.area}, ${b.city}, India`, b.coords)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-[#dce1e6] px-3 py-2 text-xs font-bold text-[#1673d1] hover:bg-[#eff7ff]"><Navigation className="size-4" />Get directions</a>
              {website && <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-[#dce1e6] px-3 py-2 text-xs font-bold text-[#1673d1] hover:bg-[#eff7ff]"><Globe className="size-4" />Website</a>}
            </div>
          </section>
          <div id="enquire" className="scroll-mt-24"><EnquiryForm businessId={b.live ? b.id : undefined} title="Get a free quote" subtitle={`Send your requirement to ${b.name}.`} directoryStyle /></div>
        </aside>
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
