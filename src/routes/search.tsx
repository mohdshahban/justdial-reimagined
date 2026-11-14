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
    <div className="container-page pt-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"><Link to="/" className="hover:underline">Home</Link><ChevronRight className="size-4" />{city ?? "All cities"}<ChevronRight className="size-4" /><span className="text-foreground">{q || "All businesses"}</span></nav>
      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">{q || "Explore businesses"}{city && <span className="text-muted-foreground"> in {area ? `${area}, ` : ""}{city}</span>}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Compare genuine listings, services and available contact options.</p>
      <DirectoryResults businesses={results} city={city} initialArea={area && results.some((b) => slugify(b.area) === slugify(area)) ? area : ""} context={q || "Local business"} />
    </div>
  );
}
