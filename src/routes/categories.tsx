import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { CATEGORIES } from "@/data/catalog";
import { CategoryTile } from "@/components/site/ui";
import { useQuery } from "@tanstack/react-query";
import { liveBusinessesQ } from "@/lib/public-data";
import { useCity } from "@/components/site/city";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [
    { title: "All categories — Justdial" }, { name: "description", content: "Browse every local service and business category on Justdial, from restaurants to wholesalers." },
    { property: "og:title", content: "All categories — Justdial" }, { property: "og:description", content: "Browse every local service and business category on Justdial, from restaurants to wholesalers." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const { city } = useCity();
  const { data: live = [] } = useQuery(liveBusinessesQ);
  const approvedInCity = live.filter((b) => b.city === city);
  const list = CATEGORIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.subs.some((s) => s.toLowerCase().includes(q.toLowerCase())));
  const groups = [...new Set(list.map((c) => c.group))];
  return (
    <div className="container-page pt-10">
      <h1 className="text-4xl font-extrabold md:text-5xl">All categories</h1>
      <p className="mt-2 text-muted-foreground">{CATEGORIES.length} categories · {approvedInCity.length} approved businesses in {city}</p>
      <label className="mt-6 flex h-12 max-w-md items-center gap-2 rounded-2xl border bg-card px-4">
        <Search className="size-5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter categories" aria-label="Filter categories" className="flex-1 bg-transparent outline-none" />
      </label>
      {groups.map((g) => (
        <section key={g} className="mt-10">
          <h2 className="mb-4 text-xl font-bold">{g}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{list.filter((c) => c.group === g).map((c) => <div key={c.slug} className="rounded-2xl border bg-card p-1"><CategoryTile {...c} /><div className="px-3 pb-3"><p className="text-center text-xs text-muted-foreground">{approvedInCity.filter((b) => b.category === c.slug).length} listings in {city}</p><div className="mt-2 flex flex-wrap justify-center gap-1">{c.subs.slice(0, 2).map((sub) => <Link key={sub} to="/category/$slug" params={{ slug: c.slug }} search={{ city, sub }} className="rounded-md bg-muted px-1.5 py-1 text-[10px] hover:bg-accent">{sub}</Link>)}</div></div></div>)}</div>
        </section>
      ))}
      {list.length === 0 && <p className="mt-10 text-muted-foreground">No category matches “{q}”.</p>}
    </div>
  );
}
