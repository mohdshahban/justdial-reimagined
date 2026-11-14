import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { liveBusinessesQ } from "@/lib/public-data";
import { CITIES, searchBusinesses } from "@/data/catalog";
import { slugify } from "@/lib/discovery";
import { DirectoryResults } from "@/components/site/directory-results";

type S = { q?: string; city?: string; area?: string };
export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s.q === "string" ? s.q.slice(0, 120) : undefined,
    city: typeof s.city === "string" && (CITIES as readonly string[]).includes(s.city) ? s.city : undefined,
    area: typeof s.area === "string" ? s.area.slice(0, 100) : undefined,
  }),
  head: () => ({ meta: [
    { title: "Find local businesses and services — Directory search" },
    { name: "description", content: "Search approved local businesses by name, category and city. Compare real reviews, services and contact information." },
    { property: "og:type", content: "website" },
  ] }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "", city, area = "" } = Route.useSearch();
  const { data: live = [] } = useQuery(liveBusinessesQ);
  const results = searchBusinesses(q, city, live);
  return (
    <div className="container-page max-w-[90rem] pt-5">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-[#718096]"><Link to="/" className="hover:underline">Home</Link><ChevronRight className="size-3.5" />{city ?? "All cities"}<ChevronRight className="size-3.5" /><span className="text-[#435267]">{q || "All businesses"}</span></nav>
      <h1 className="mt-3 text-[23px] font-bold leading-tight tracking-tight text-[#1c2b3a] md:text-[26px]">{q || "Explore businesses"}{city && <span> in {area ? `${area}, ` : ""}{city}</span>}</h1>
      <p className="mt-1 text-[13px] text-[#6b7887]">Browse local businesses, compare services and contact the provider directly.</p>
      <DirectoryResults businesses={results} city={city} initialArea={area && results.some((b) => slugify(b.area) === slugify(area)) ? area : ""} context={q || "Local business"} />
    </div>
  );
}
