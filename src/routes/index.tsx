import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, CarTaxiFront, Clapperboard, Flame, Hotel, Plane, Smartphone, Stethoscope, Wrench, Zap, Tv, Fuel, CreditCard, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import hero from "@/assets/hero-street.jpg";
import { useQuery } from "@tanstack/react-query";
import { liveBusinessesQ } from "@/lib/public-data";
import { CATEGORIES, TRENDING } from "@/data/catalog";
import { SearchBar } from "@/components/site/search-bar";
import { CategoryTile, MiniBusinessCard, SectionHeader, btnClass, EnquiryForm } from "@/components/site/ui";
import { useCity } from "@/components/site/city";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Justdial — Find anything near you, in seconds" },
      { name: "description", content: "Discover approved local businesses: restaurants, doctors, AC repair, movers and more. Compare actual business information and enquire directly." },
      { property: "og:title", content: "Justdial — Find anything near you, in seconds" },
      { property: "og:description", content: "Search local businesses, compare ratings and reviews, and get the best price." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const QUICK = [
  { label: "B2B", icon: Building2, to: "/b2b" as const },
  { label: "Doctors", icon: Stethoscope, slug: "doctors" },
  { label: "Hotels", icon: Hotel, slug: "hotels" },
  { label: "Repairs", icon: Wrench, slug: "ac-repair" },
  { label: "Movies", icon: Clapperboard, to: "/movies" as const },
  { label: "Travel", icon: Plane, to: "/travel" as const },
  { label: "Cabs", icon: CarTaxiFront, slug: "car-rental" },
];
const BILLS = [
  { label: "Mobile", icon: Smartphone }, { label: "Electricity", icon: Zap }, { label: "DTH", icon: Tv },
  { label: "Gas", icon: Flame }, { label: "FASTag", icon: Fuel }, { label: "Credit card", icon: CreditCard },
];
function Row({ title, eyebrow, cat }: { title: string; eyebrow: string; cat: string[] }) {
  const { city } = useCity();
  const { data: live = [] } = useQuery(liveBusinessesQ);
  const items = live.filter((b) => cat.includes(b.category) && b.city === city);
  if (!items.length) return null;
  return (
    <section className="container-page mt-20">
      <SectionHeader eyebrow={eyebrow} title={title} action={<Link to="/category/$slug" params={{ slug: cat[0]! }} className="hidden items-center gap-1 text-sm font-bold hover:underline sm:flex">View all <ArrowRight className="size-4" /></Link>} />
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        {items.map((b) => <div key={b.id} className="snap-start"><MiniBusinessCard b={b} /></div>)}
      </div>
    </section>
  );
}

function Home() {
  const { city } = useCity();
  const navigate = useNavigate();
  const { data: live = [] } = useQuery(liveBusinessesQ);
  const inCity = live.filter((b) => b.city === city);
  const reviews = inCity.flatMap((b) => b.reviewList.map((r) => ({ ...r, id: b.id, business: b.name }))).slice(0, 3);
  const suppliers = inCity.filter((b) => b.category === "manufacturers" || b.category === "wholesale").slice(0, 5);
  const popularAreas = [...new Set(inCity.map((b) => b.area).filter(Boolean))].slice(0, 12);
  const stats = [
    { value: live.length.toLocaleString("en-IN"), label: "approved business listings" },
    { value: CATEGORIES.length.toString(), label: "local business categories" },
    { value: new Set(live.map((b) => b.city)).size.toString(), label: "cities with published businesses" },
    { value: live.reduce((n, b) => n + b.reviews, 0).toLocaleString("en-IN"), label: "customer ratings received" },
  ];
  return (
    <>
      {/* Hero */}
      <section className="container-page pt-6 md:pt-10">
        <div className="grain relative overflow-hidden rounded-[2rem] bg-gradient-ink text-ink-foreground">
          <img src={hero} alt="A busy Indian neighbourhood street with shops" width={1600} height={1008} className="absolute inset-0 size-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/10" />
          <div className="relative px-6 py-16 md:px-14 md:py-24">
            <p className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1 text-xs font-bold backdrop-blur"><TrendingUp className="size-3.5 text-primary" />Explore {live.length} approved listings across {CATEGORIES.length} categories</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.02] md:text-7xl">
              Find anything near you, <span className="text-primary">in seconds.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-ink-muted md:text-lg">Restaurants, doctors, repairs and more. Find local services, compare actual business details and connect directly.</p>
            <div className="mt-8 max-w-3xl text-foreground"><SearchBar /></div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-muted">Trending in {city}:</span>
              {TRENDING.slice(0, 6).map((t) => (
                <Link key={t} to="/search" search={{ q: t, city }} className="rounded-full border border-ink-foreground/20 px-3 py-1 text-sm font-semibold hover:bg-ink-foreground/10">{t}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="container-page mt-8">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {QUICK.map((q) => {
            const inner = <><q.icon className="size-5 text-coral" /><span>{q.label}</span></>;
            const cls = "flex shrink-0 items-center gap-2 rounded-2xl border bg-card px-5 py-3 text-sm font-bold lift";
            return q.to ? <Link key={q.label} to={q.to} className={cls}>{inner}</Link> : <Link key={q.label} to="/category/$slug" params={{ slug: q.slug! }} className={cls}>{inner}</Link>;
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page mt-16">
        <SectionHeader eyebrow="Explore" title="Popular categories" action={<Link to="/categories" className="flex items-center gap-1 text-sm font-bold hover:underline">All categories <ArrowRight className="size-4" /></Link>} />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.slice(0, 16).map((c) => <CategoryTile key={c.slug} {...c} />)}
        </div>
      </section>

      <Row eyebrow="Near you" title={`Restaurants in ${city}`} cat={["restaurants"]} />
      <Row eyebrow="Health" title={`Hospitals & clinics in ${city}`} cat={["hospitals", "doctors"]} />
      <Row eyebrow="At your doorstep" title={`Home services in ${city}`} cat={["ac-repair", "plumbers", "packers-movers"]} />
      <Row eyebrow="Local learning" title={`Schools & classes in ${city}`} cat={["schools", "tutors", "dance"]} />

      {/* Justdial-style thematic category collections, linked to real category archives. */}
      <section className="container-page mt-16">
        <SectionHeader eyebrow="Explore by need" title="Discover services for every occasion" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Wedding requisites", detail: "Planners, caterers and local venues", slugs: ["wedding", "caterers", "hotels"] },
            { title: "Beauty & wellness", detail: "Salons, spa treatments and fitness", slugs: ["beauty-spa", "gyms", "doctors"] },
            { title: "Repairs & home care", detail: "AC service, plumbers and electricians", slugs: ["ac-repair", "plumbers", "electricians", "pest-control"] },
          ].map((group) => <div key={group.title} className="rounded-3xl border bg-card p-6 shadow-soft"><h3 className="text-xl font-bold">{group.title}</h3><p className="mt-1 text-sm text-muted-foreground">{group.detail}</p><div className="mt-5 flex flex-wrap gap-2">{group.slugs.map((slug) => { const cat = CATEGORIES.find((c) => c.slug === slug); return cat ? <Link key={slug} to="/category/$slug" params={{ slug }} search={{ city }} className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold hover:bg-accent">{cat.name}</Link> : null; })}</div></div>)}
        </div>
      </section>

      {popularAreas.length > 0 && <section className="container-page mt-16">
        <SectionHeader eyebrow="Explore your neighbourhood" title={`Popular localities in ${city}`} />
        <div className="flex flex-wrap gap-3">{popularAreas.map((area) => <Link key={area} to="/search" search={{ q: area, city }} className="rounded-xl border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted">{area}<ArrowRight className="ml-2 inline size-4 text-muted-foreground" /></Link>)}</div>
      </section>}

      {/* Bills */}
      <section className="container-page mt-20">
        <div className="rounded-3xl border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-2xl font-bold">Bills & recharge</h2><p className="text-sm text-muted-foreground">Explore recharge and bill payment categories.</p></div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
            {BILLS.map((b) => (
              <button key={b.label} onClick={() => navigate({ to: "/recharge" })} className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-4 text-sm font-semibold transition hover:bg-accent">
                <b.icon className="size-6" />{b.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* B2B */}
      <section className="container-page mt-20">
        <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-saffron-soft p-6 md:grid-cols-2 md:p-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-coral">B2B marketplace</p>
            <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Find manufacturers and wholesale suppliers</h2>
            <p className="mt-3 text-muted-foreground">Browse published suppliers and request a quote directly from available businesses.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Garments", "Machinery", "Packaging", "FMCG", "Hardware", "Textiles", "Electricals"].map((t) => <span key={t} className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-soft">{t}</span>)}
            </div>
            <Link to="/b2b" className={`${btnClass("ink")} mt-8`}>Explore B2B <ArrowRight className="size-4" /></Link>
          </div>
          {suppliers.length ? <EnquiryForm title="Post your requirement" subtitle="Share your needs with available suppliers." cta="Get quotes" businessIds={suppliers.map((b) => b.id)} /> : <div className="flex flex-col items-start justify-center rounded-3xl bg-card p-6"><h3 className="text-lg font-bold">Supplier enquiries are coming soon</h3><p className="mt-2 text-sm text-muted-foreground">Browse the registered suppliers while more join this city.</p><Link to="/category/$slug" params={{ slug: "manufacturers" }} search={{ city }} className={`${btnClass("ink")} mt-5`}>Browse manufacturers</Link></div>}
        </div>
      </section>

      {/* Stats */}
      <section className="container-page mt-20 grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-l-4 border-primary pl-4">
            <p className="font-display text-3xl font-extrabold md:text-5xl">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Actual customer reviews only; never generate invented testimonials. */}
      <section className="container-page mt-20">
        <SectionHeader eyebrow="Community" title={reviews.length ? `Customer experiences in ${city}` : "Find a business with confidence"} />
        {reviews.length ? <div className="grid gap-4 md:grid-cols-3">{reviews.map((r, index) => <figure key={`${r.id}-${index}`} className="rounded-3xl border bg-card p-6"><div className="flex gap-0.5 text-primary">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}</div><blockquote className="mt-3 line-clamp-4 text-[15px] leading-relaxed">{r.text}</blockquote><figcaption className="mt-4 text-sm"><span className="font-bold">{r.name}</span><span className="text-muted-foreground"> · </span><Link to="/business/$id" params={{ id: r.id }} className="font-semibold hover:underline">{r.business}</Link></figcaption></figure>)}</div> : <div className="grid gap-4 md:grid-cols-3">{[["1", "Search your area", "Find businesses by service, city or locality."], ["2", "Compare details", "Check genuine ratings, services and opening hours where listed."], ["3", "Contact directly", "Call, message or request a quote from a real business listing."]].map(([number, title, detail]) => <div key={number} className="rounded-3xl border bg-card p-6"><span className="grid size-10 place-items-center rounded-xl bg-saffron-soft font-bold">{number}</span><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>)}</div>}
      </section>

      {/* Grow business */}
      <section className="container-page mt-20">
        <div className="grain relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-gradient-ink p-8 text-ink-foreground md:grid-cols-[1.4fr_1fr] md:p-14">
          <div>
            <h2 className="text-3xl font-extrabold md:text-5xl">Own a business? <span className="text-primary">Get found.</span></h2>
            <p className="mt-4 max-w-lg text-ink-muted">Make your business easier to discover. Add accurate services, contact information and photos for local customers.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Create a basic listing", "Receive enquiries in your business dashboard", "Add your business photos and services"].map((t) => <li key={t} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />{t}</li>)}
            </ul>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Link to="/free-listing" className={`${btnClass("primary")} h-14 px-8 text-base`}>List your business free <ArrowRight className="size-5" /></Link>
            <Link to="/advertise" className="text-sm font-semibold text-ink-muted hover:text-ink-foreground">Or explore advertising →</Link>
          </div>
        </div>
      </section>

      {/* App */}
      <section className="container-page mt-20 grid items-center gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold md:text-4xl">Find local businesses on any device</h2>
          <p className="mt-3 text-muted-foreground">Our directory works on desktop and mobile browsers. Search, compare, save businesses on your device and get directions.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/categories" className={btnClass("ink")}>Explore categories <ArrowRight className="size-4" /></Link>
            <Link to="/free-listing" className={btnClass("outline")}>Add your business</Link>
          </div>
        </div>
        <div className="mx-auto w-64 rounded-[2.5rem] border-8 border-ink bg-background p-4 shadow-lift">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-ink/20" />
          <div className="rounded-2xl bg-gradient-ink p-4 text-ink-foreground"><p className="text-xs text-ink-muted">Good evening</p><p className="font-display text-lg font-bold">What do you need?</p></div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {CATEGORIES.slice(0, 6).map((c) => <div key={c.slug} className="rounded-xl bg-saffron-soft p-2 text-center text-[10px] font-bold leading-tight">{c.name}</div>)}
          </div>
          <div className="mt-3 space-y-2">{inCity.slice(0, 2).map((b) => <div key={b.id} className="flex items-center gap-2 rounded-xl border p-2"><img src={b.image} alt="" className="size-9 rounded-lg object-cover" loading="lazy" /><div className="min-w-0"><p className="truncate text-xs font-bold">{b.name}</p><p className="text-[10px] text-muted-foreground">{b.reviews ? `★ ${b.rating} · ` : ""}{b.area}</p></div></div>)}</div>
        </div>
      </section>
    </>
  );
}
