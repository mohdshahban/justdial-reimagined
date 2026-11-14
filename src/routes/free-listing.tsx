import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, PhoneCall, Store, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CATEGORIES, CITIES } from "@/data/catalog";
import { Btn, SectionHeader } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { liveBusinessesQ } from "@/lib/public-data";

export const Route = createFileRoute("/free-listing")({
  head: () => ({ meta: [
    { title: "List your business free — Get customers who are already searching | Justdial" }, { name: "description", content: "Add your business to Justdial for free in 2 minutes. Get calls and WhatsApp leads from customers searching near you." },
    { property: "og:title", content: "List your business free — Get customers who are already searching | Justdial" }, { property: "og:description", content: "Add your business to Justdial for free in 2 minutes. Get calls and WhatsApp leads from customers searching near you." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const [form, setForm] = useState({ name: "", phone: "", city: "Noida", cat: "restaurants" });
  const { data: live = [] } = useQuery(liveBusinessesQ);
  const nav = useNavigate();
  return (
    <div className="container-page pt-6">
      <section className="grid items-center gap-10 rounded-[2rem] bg-saffron-soft p-8 md:grid-cols-[1.2fr_1fr] md:p-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-coral">For business owners</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-6xl">Get customers who are already searching for you.</h1>
          <p className="mt-4 max-w-lg text-muted-foreground">Create a free listing, add your actual business details and submit it for review before it appears publicly.</p>
          <div className="mt-8 grid grid-cols-2 gap-4">{[{ value: live.length, label: "approved businesses" }, { value: CATEGORIES.length, label: "available categories" }].map((s) => <div key={s.label}><p className="font-display text-3xl font-extrabold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>)}</div>
        </div>
        <form id="signup" onSubmit={(e) => { e.preventDefault(); if (!/^[6-9]\d{9}$/.test(form.phone)) { toast.error("Enter a valid 10-digit mobile number"); return; } try { sessionStorage.setItem("business-onboarding-v1", JSON.stringify(form)); } catch { /* User can enter details after signing in. */ } toast.info("Sign in to finish and submit your business listing."); nav({ to: "/auth", search: { redirect: "/dashboard/businesses?new=true" } }); }} className="space-y-3 rounded-3xl border bg-card p-6 shadow-lift">
          <h2 className="text-xl font-bold">List your business</h2>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Business name" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} inputMode="numeric" placeholder="Mobile number" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} aria-label="City" className="h-11 rounded-xl border border-input bg-background px-3 text-sm">{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} aria-label="Category" className="h-11 rounded-xl border border-input bg-background px-3 text-sm">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
          </div>
          <Btn type="submit" className="w-full">Continue to listing details</Btn>
          <p className="text-center text-xs text-muted-foreground">Your details are saved in this browser for the next step</p>
        </form>
      </section>

      <section className="mt-20">
        <SectionHeader eyebrow="How it works" title="Your listing in three steps" />
        <div className="grid gap-4 md:grid-cols-3">{[[Store, "Add real details", "Enter your name, address, contact information, services and photos."], [PhoneCall, "Submit for review", "Listings are checked before public approval. Verification badges are separate."], [TrendingUp, "Manage enquiries", "Once approved, your business page can receive direct enquiries in your dashboard."]].map(([I, t, d], i) => { const Ic = I as typeof Store; return <div key={i} className="rounded-3xl border bg-card p-6"><Ic className="size-7 text-coral" /><h3 className="mt-4 text-lg font-bold">{t as string}</h3><p className="text-sm text-muted-foreground">{d as string}</p></div>; })}</div>
      </section>

      <section className="mt-20">
        <SectionHeader eyebrow="Included" title="What you can manage" />
        <div className="grid gap-4 md:grid-cols-3">{["Business profile and contact details", "Services, products and photos", "Customer enquiries and owner replies"].map((feature) => <div key={feature} className="flex items-start gap-3 rounded-2xl border bg-card p-5"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /><span className="font-semibold">{feature}</span></div>)}</div>
      </section>

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-4 text-center text-3xl font-bold">Questions, answered</h2>
        <Accordion type="single" collapsible className="rounded-3xl border bg-card px-5">
          {[["Is a basic listing free?", "Yes. You can create and submit a basic listing without a credit card."], ["How do I get leads?", "Customers can contact you directly using published details or submit enquiries that appear in your dashboard."], ["When does my business appear in search?", "Only after the listing has been reviewed and approved."]].map(([q, a]) => <AccordionItem key={q} value={q!}><AccordionTrigger className="text-left font-semibold">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
        </Accordion>
      </section>
    </div>
  );
}
