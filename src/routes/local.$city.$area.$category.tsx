import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin } from "lucide-react";
import { CITIES, getCategory } from "@/data/catalog";
import { liveBusinessesQ } from "@/lib/public-data";
import { slugify } from "@/lib/discovery";
import { DirectoryResults } from "@/components/site/directory-results";

export const Route = createFileRoute("/local/$city/$area/$category")({
  loader: async ({ params, context }) => {
    const city = CITIES.find((c) => slugify(c) === params.city);
    const category = getCategory(params.category);
    if (!city || !category) throw notFound();
    const all = await context.queryClient.ensureQueryData(liveBusinessesQ);
    const match = all.find((b) => b.city === city && b.category === category.slug && slugify(b.area) === params.area);
    if (!match) throw notFound();
    return { city, category, area: match.area };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.category.name} in ${loaderData.area}, ${loaderData.city}` : "Local businesses";
    return { meta: [
      { title: `${title} | Business directory` },
      { name: "description", content: `Find approved ${loaderData?.category.name.toLowerCase() ?? "businesses"} near ${loaderData?.area ?? "you"}. Compare real business details and send enquiries directly.` },
      { property: "og:title", content: title },
      { property: "og:type", content: "website" },
    ] };
  },
  component: LocalArchive,
});

function LocalArchive() {
  const { city, area, category } = Route.useLoaderData();
  const { data: all = [] } = useQuery(liveBusinessesQ);
  const list = all.filter((b) => b.city === city && b.category === category.slug && slugify(b.area) === slugify(area));
  return (
    <div className="container-page pt-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"><Link to="/">Home</Link><ChevronRight className="size-4" /><Link to="/category/$slug" params={{ slug: category.slug }} search={{ city }}>{category.name}</Link><ChevronRight className="size-4" />{city}<ChevronRight className="size-4" /><span className="text-foreground">{area}</span></nav>
      <header className="mt-5 rounded-[2rem] border bg-saffron-soft p-7 md:p-10">
        <p className="flex items-center gap-2 text-sm font-bold text-coral"><MapPin className="size-4" />Local business directory</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">{category.name} in {area}, {city}</h1>
        <p className="mt-3 text-muted-foreground">Browse {list.length} approved {list.length === 1 ? "business" : "businesses"}, check services and contact providers directly.</p>
      </header>
      <DirectoryResults businesses={list} city={city} category={category.slug} initialArea={area} context={category.name} />
      <p className="mt-10 text-sm text-muted-foreground">Looking elsewhere? <Link to="/category/$slug" params={{ slug: category.slug }} search={{ city }} className="font-semibold text-foreground underline">View all {category.name.toLowerCase()} in {city}</Link>.</p>
    </div>
  );
}
