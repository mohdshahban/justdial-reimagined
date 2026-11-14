import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { CATEGORIES, CITIES, getCategory } from "@/data/catalog";
import { CategoryTile } from "@/components/site/ui";
import { DirectoryResults } from "@/components/site/directory-results";
import { DynIcon } from "@/components/site/icon";
import { useCity } from "@/components/site/city";
import { useQuery } from "@tanstack/react-query";
import { liveBusinessesQ } from "@/lib/public-data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type CategorySearch = { city?: string; sub?: string; area?: string };
export const Route = createFileRoute("/category/$slug")({
  validateSearch: (s: Record<string, unknown>): CategorySearch => ({
    city: typeof s.city === "string" && (CITIES as readonly string[]).includes(s.city) ? s.city : undefined,
    sub: typeof s.sub === "string" ? s.sub.slice(0, 100) : undefined,
    area: typeof s.area === "string" ? s.area.slice(0, 100) : undefined,
  }),
  loader: ({ params }) => {
    const cat = getCategory(params.slug);
    if (!cat) throw notFound();
    return { cat };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.cat.name ?? "Category";
    return { meta: [
      { title: `${n} near you — Browse local businesses` },
      { name: "description", content: `Browse ${n.toLowerCase()} by area and speciality. See approved listings, real ratings, timings and direct contact options.` },
      { property: "og:title", content: `Local ${n} businesses` },
      { property: "og:type", content: "website" },
    ] };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { cat } = Route.useLoaderData();
  const { city: savedCity } = useCity();
  const { city: queryCity, sub = "", area = "" } = Route.useSearch();
  const city = queryCity || savedCity;
  const { data: live = [] } = useQuery(liveBusinessesQ);
  const list = live.filter((b) => b.category === cat.slug && b.city === city);
  const related = CATEGORIES.filter((c) => c.group === cat.group && c.slug !== cat.slug).slice(0, 6);
  return (
    <div className="container-page pt-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"><Link to="/" className="hover:underline">Home</Link><ChevronRight className="size-4" /><Link to="/categories" className="hover:underline">Categories</Link><ChevronRight className="size-4" /><span className="text-foreground">{cat.name}</span></nav>
      <header className="mt-4 flex flex-wrap items-center gap-5 rounded-[2rem] bg-saffron-soft p-6 md:p-10">
        <span className="grid size-16 place-items-center rounded-2xl bg-card shadow-soft"><DynIcon name={cat.icon} className="size-8" /></span>
        <div><h1 className="text-3xl font-extrabold md:text-5xl">{cat.name} in {city}</h1><p className="mt-2 text-muted-foreground">{list.length} approved {list.length === 1 ? "listing" : "listings"} · Filter by speciality and locality</p></div>
      </header>
      <nav aria-label="Specialties" className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        <Link to="/category/$slug" params={{ slug: cat.slug }} search={{ city }} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${!sub ? "bg-ink text-ink-foreground" : "bg-card hover:bg-muted"}`}>All {cat.name}</Link>
        {cat.subs.map((s) => <Link key={s} to="/category/$slug" params={{ slug: cat.slug }} search={{ city, sub: s }} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${sub === s ? "bg-ink text-ink-foreground" : "bg-card hover:bg-muted"}`}>{s}</Link>)}
      </nav>
      <DirectoryResults businesses={list} city={city} category={cat.slug} initialSub={sub} initialArea={area} context={cat.name} />
      <section className="mt-14"><h2 className="mb-4 text-2xl font-bold">Frequently asked about {cat.name.toLowerCase()}</h2>
        <Accordion type="single" collapsible className="rounded-3xl border bg-card px-5">{[
          [`How do I choose ${cat.name.toLowerCase()}?`, "Compare services, recent customer ratings, location and verified business details before contacting a provider."],
          ["Is sending an enquiry free?", "Yes. You can send a request to the listed businesses without paying the directory."],
          ["What does a Verified badge mean?", "A Verified badge appears only on businesses marked verified by the platform. It is not a guarantee of service quality."],
        ].map(([q, answer]) => <AccordionItem key={q} value={q}><AccordionTrigger className="text-left font-semibold">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion>
      </section>
      {related.length > 0 && <section className="mt-12"><h2 className="mb-4 text-2xl font-bold">Related categories</h2><div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">{related.map((c) => <CategoryTile key={c.slug} {...c} />)}</div></section>}
    </div>
  );
}
