import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPinned, Navigation, SearchX, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, getCategory, type Business } from "@/data/catalog";
import { distanceKm, directionsUrl, slugify, type Coordinates } from "@/lib/discovery";
import { liveBusinessesQ } from "@/lib/public-data";
import { BusinessCard, EnquiryForm } from "./ui";
import { cn } from "@/lib/utils";

type Order = "Relevance" | "Rating" | "Popular" | "Nearest";

export function DirectoryResults({ businesses, city, category, initialSub = "", initialArea = "", context }: {
  businesses: Business[];
  city?: string;
  category?: string;
  initialSub?: string;
  initialArea?: string;
  context: string;
}) {
  const [order, setOrder] = useState<Order>("Relevance");
  const [sub, setSub] = useState(initialSub);
  const [area, setArea] = useState(initialArea);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [top, setTop] = useState(false);
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [near, setNear] = useState(false);
  const [position, setPosition] = useState<Coordinates>();
  const [locating, setLocating] = useState(false);
  const { data: all = [] } = useQuery(liveBusinessesQ);

  useEffect(() => { setSub(initialSub); setArea(initialArea); }, [initialSub, initialArea]);
  const areas = useMemo(() => [...new Set(businesses.map((b) => b.area).filter(Boolean))].sort(), [businesses]);
  const cats = useMemo(() => [...new Set(businesses.map((b) => b.category))].map(getCategory).filter((c) => c !== undefined), [businesses]);
  const subs = category ? getCategory(category)?.subs ?? [] : [];
  const hasCoordinates = businesses.some((b) => !!b.coords);
  const hasTimings = businesses.some((b) => b.openKnown);

  const results = useMemo(() => {
    const filtered = businesses.filter((b) => {
      const text = [b.sub, ...b.tags, ...b.services.map((s) => s.name)].join(" ").toLowerCase();
      if (sub && !text.includes(sub.toLowerCase())) return false;
      if (area && slugify(b.area) !== slugify(area)) return false;
      if (categoryFilter && b.category !== categoryFilter) return false;
      if (top && (b.reviews === 0 || b.rating < 4.5)) return false;
      if (verified && !b.verified) return false;
      if (open && !(b.openKnown && b.open)) return false;
      if (near && (!position || !b.coords || distanceKm(position, b.coords) > 3)) return false;
      return true;
    });
    if (order === "Rating") return filtered.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    if (order === "Popular") return filtered.sort((a, b) => b.reviews - a.reviews);
    if (order === "Nearest" && position) return filtered.sort((a, b) =>
      (a.coords ? distanceKm(position, a.coords) : Infinity) - (b.coords ? distanceKm(position, b.coords) : Infinity));
    return filtered;
  }, [businesses, sub, area, categoryFilter, top, verified, open, near, position, order]);

  const requestPosition = () => {
    if (!hasCoordinates) { toast.info("Nearby filtering will be available when businesses add map coordinates."); return; }
    if (position) { setNear(!near); return; }
    if (typeof navigator === "undefined" || !navigator.geolocation) { toast.error("Location is not supported in this browser."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setPosition({ lat: coords.latitude, lng: coords.longitude }); setNear(true); setLocating(false); },
      () => { setLocating(false); toast.error("Location was not shared. You can still filter by locality."); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
    );
  };

  const chip = (label: string, active: boolean, onClick: () => void, disabled = false, title?: string) => (
    <button type="button" onClick={onClick} aria-pressed={active} disabled={disabled} title={title}
      className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40", active ? "border-ink bg-ink text-ink-foreground" : "bg-card hover:bg-muted")}>{label}</button>
  );

  const activeFilters = top || open || verified || near || area || sub || categoryFilter;
  const mapQuery = [context, area || city].filter(Boolean).join(" in ");

  return (
    <>
      <div className="sticky top-28 z-30 -mx-4 mt-6 border-y bg-background/95 px-4 py-3 shadow-sm backdrop-blur md:top-16 md:-mx-8 md:px-8">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold"><SlidersHorizontal className="size-4" />Filters</span>
          <select value={order} onChange={(e) => setOrder(e.target.value as Order)} aria-label="Sort by" className="h-10 shrink-0 rounded-full border bg-card px-3 text-sm font-semibold">
            <option value="Relevance">Sort: Relevance</option><option value="Rating">Highest rated</option><option value="Popular">Most reviewed</option>
            {position && hasCoordinates && <option value="Nearest">Nearest first</option>}
          </select>
          {chip("★ 4.5+", top, () => setTop(!top))}
          {chip("Open now", open, () => setOpen(!open), !hasTimings, "Shown only for businesses with listed opening hours")}
          {chip("Verified", verified, () => setVerified(!verified))}
          {chip(locating ? "Finding location…" : "Within 3 km", near, requestPosition, locating || !hasCoordinates, hasCoordinates ? "Requires location permission" : "Map coordinates unavailable")}
          {areas.length > 1 && <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filter by locality" className="h-10 max-w-48 shrink-0 rounded-full border bg-card px-3 text-sm font-semibold"><option value="">All localities</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}</select>}
          {!category && cats.length > 1 && <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category" className="h-10 max-w-48 shrink-0 rounded-full border bg-card px-3 text-sm font-semibold"><option value="">All categories</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>}
          {category && subs.length > 0 && <select value={sub} onChange={(e) => setSub(e.target.value)} aria-label="Filter by subcategory" className="h-10 max-w-48 shrink-0 rounded-full border bg-card px-3 text-sm font-semibold"><option value="">All specialties</option>{subs.map((s) => <option key={s} value={s}>{s}</option>)}</select>}
          {activeFilters && <button type="button" onClick={() => { setTop(false); setOpen(false); setVerified(false); setNear(false); setArea(""); setSub(""); setCategoryFilter(""); }} className="flex shrink-0 items-center gap-1 text-sm font-bold text-coral"><X className="size-4" />Clear</button>}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">{results.length} {results.length === 1 ? "business" : "businesses"} found{area && ` in ${area}`}</p>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {results.length === 0 ? <div className="rounded-3xl border border-dashed bg-card p-10 text-center"><SearchX className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-3 text-xl font-bold">No matching businesses yet</h2><p className="mt-2 text-sm text-muted-foreground">Try another locality, specialty or fewer filters. We only display real approved listings.</p></div>
            : results.map((b) => <BusinessCard key={b.id} b={position && b.coords ? { ...b, distance: distanceKm(position, b.coords) } : b} />)}
        </div>
        <aside className="space-y-5 lg:sticky lg:top-36 lg:self-start">
          <a href={directionsUrl(mapQuery)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-soft hover:bg-muted"><span className="flex items-center gap-2 font-semibold"><MapPinned className="size-5 text-coral" />Explore this area on Maps</span><Navigation className="size-4" /></a>
          {results.length > 0 && <EnquiryForm title={`Get quotes from ${Math.min(5, results.length)} businesses`} subtitle={`Tell ${context.toLowerCase()} providers what you need.`} cta="Request free quotes" businessIds={results.slice(0, 5).map((b) => b.id)} />}
          {category && city && areas.length > 0 && <section className="rounded-2xl border bg-card p-5"><h3 className="font-bold">Browse by locality</h3><div className="mt-3 flex flex-wrap gap-2">{areas.slice(0, 15).map((a) => <Link key={a} to="/local/$city/$area/$category" params={{ city: slugify(city), area: slugify(a), category }} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-accent">{a}</Link>)}</div></section>}
          {!hasCoordinates && all.length > 0 && <p className="text-xs text-muted-foreground">Distance and nearby filtering require map coordinates supplied for each business.</p>}
        </aside>
      </div>
    </>
  );
}
