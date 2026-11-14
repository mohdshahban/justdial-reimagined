import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, MapPinned, Navigation, SearchX, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { getCategory, type Business } from "@/data/catalog";
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
  const [moreFilters, setMoreFilters] = useState(false);
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
      className={cn("shrink-0 rounded-md border border-[#dce1e6] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#273645] transition hover:border-[#9baec2] disabled:cursor-not-allowed disabled:opacity-40", active && "border-[#1878d3] bg-[#eaf5ff] text-[#0964af]")}>{label}</button>
  );

  const activeFilters = top || open || verified || near || area || sub || categoryFilter;
  const extraFilters = areas.length > 1 || (!category && cats.length > 1) || (category && subs.length > 0);
  const mapQuery = [context, area || city].filter(Boolean).join(" in ");

  return (
    <>
      <div className="mt-5 border-b border-[#e3e7ec] pb-4">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <label className="flex h-[37px] shrink-0 items-center rounded-md border border-[#dce1e6] bg-white pl-3">
          <SlidersHorizontal className="size-3.5 text-[#415366]" />
          <select value={order} onChange={(e) => setOrder(e.target.value as Order)} aria-label="Sort by" className="h-full max-w-40 bg-transparent px-2 text-[13px] font-semibold text-[#273645] outline-none">
            <option value="Relevance">Sort: Relevance</option><option value="Rating">Highest rated</option><option value="Popular">Most reviewed</option>
            {position && hasCoordinates && <option value="Nearest">Nearest first</option>}
          </select>
          </label>
          {chip("Open Now", open, () => setOpen(!open), !hasTimings, "Shown only for businesses with listed opening hours")}
          {chip("Top Rated", top, () => setTop(!top))}
          {chip("Verified", verified, () => setVerified(!verified))}
          {chip(locating ? "Finding location…" : "Near Me", near, requestPosition, locating || !hasCoordinates, hasCoordinates ? "Requires location permission" : "Map coordinates unavailable")}
          {extraFilters && <button type="button" onClick={() => setMoreFilters(!moreFilters)} aria-expanded={moreFilters} className={cn("flex shrink-0 items-center gap-1.5 rounded-md border border-[#dce1e6] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#273645]", moreFilters && "border-[#1878d3] bg-[#eaf5ff] text-[#0964af]")}>All Filters<ChevronDown className={cn("size-3.5 transition", moreFilters && "rotate-180")} /></button>}
          {activeFilters && <button type="button" onClick={() => { setTop(false); setOpen(false); setVerified(false); setNear(false); setArea(""); setSub(""); setCategoryFilter(""); }} className="flex shrink-0 items-center gap-1 px-2 text-[13px] font-bold text-[#1264b1]"><X className="size-4" />Clear</button>}
        </div>
        {moreFilters && extraFilters && <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-[#e0e5ea] bg-[#f8fafc] p-3">
          {areas.length > 1 && <label className="text-xs font-semibold text-[#435267]">Locality<select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filter by locality" className="mt-1 block h-9 w-full min-w-36 rounded-md border bg-white px-3 text-sm"><option value="">All localities</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>}
          {!category && cats.length > 1 && <label className="text-xs font-semibold text-[#435267]">Category<select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category" className="mt-1 block h-9 w-full min-w-40 rounded-md border bg-white px-3 text-sm"><option value="">All categories</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>}
          {category && subs.length > 0 && <label className="text-xs font-semibold text-[#435267]">Specialty<select value={sub} onChange={(e) => setSub(e.target.value)} aria-label="Filter by subcategory" className="mt-1 block h-9 w-full min-w-44 rounded-md border bg-white px-3 text-sm"><option value="">All specialties</option>{subs.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>}
        </div>}
      </div>

      <p aria-live="polite" className="mt-4 text-[13px] font-medium text-[#667789]">{results.length} {results.length === 1 ? "business" : "businesses"} found{area && ` in ${area}`}</p>
      <div className="mt-3 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {results.length === 0 ? <div className="rounded-3xl border border-dashed bg-card p-10 text-center"><SearchX className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-3 text-xl font-bold">No matching businesses yet</h2><p className="mt-2 text-sm text-muted-foreground">Try another locality, specialty or fewer filters. We only display real approved listings.</p></div>
            : results.map((b) => <BusinessCard key={b.id} b={position && b.coords ? { ...b, distance: distanceKm(position, b.coords) } : b} />)}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {results.length > 0 && <EnquiryForm title={`Get the list of top ${context.toLowerCase()}`} subtitle="Tell us what you need. Your enquiry goes directly to matching businesses." cta="Get free quotes" businessIds={results.slice(0, 5).map((b) => b.id)} directoryStyle />}
          <a href={directionsUrl(mapQuery)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-[#e0e4e9] bg-white p-4 hover:bg-[#f7f9fb]"><span className="flex items-center gap-2 text-sm font-semibold"><MapPinned className="size-5 text-[#1673d1]" />Explore this area on Maps</span><Navigation className="size-4" /></a>
          {category && city && areas.length > 0 && <section className="rounded-xl border border-[#e0e4e9] bg-white p-4"><h3 className="text-sm font-bold">Browse by locality</h3><div className="mt-3 flex flex-wrap gap-2">{areas.slice(0, 15).map((a) => <Link key={a} to="/local/$city/$area/$category" params={{ city: slugify(city), area: slugify(a), category }} className="rounded bg-[#f2f4f6] px-2.5 py-1.5 text-xs font-semibold hover:bg-[#e6ebef]">{a}</Link>)}</div></section>}
          {!hasCoordinates && all.length > 0 && <p className="text-xs text-muted-foreground">Distance and nearby filtering require map coordinates supplied for each business.</p>}
        </aside>
      </div>
    </>
  );
}
