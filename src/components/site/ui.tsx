import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Phone, MessageCircle, Star, ShieldCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { useState, type ReactNode } from "react";
import { getCategory, type Business } from "@/data/catalog";
import { DynIcon } from "./icon";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { phoneHref, whatsappUrl } from "@/lib/discovery";

export function RatingBadge({ rating, className }: { rating: number; className?: string }) {
  if (!rating) return <span className={cn("inline-flex rounded-lg bg-saffron-soft px-2 py-0.5 text-sm font-bold text-ink", className)}>New</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg bg-success px-2 py-0.5 text-sm font-bold text-success-foreground", className)}>
      {rating.toFixed(1)} <Star className="size-3.5 fill-current" />
    </span>
  );
}

export function Btn({ variant = "primary", className, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ink" | "outline" | "success" | "ghost" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:brightness-105 shadow-soft",
    ink: "bg-ink text-ink-foreground hover:opacity-90",
    outline: "border border-input bg-card text-foreground hover:bg-muted",
    success: "bg-success text-success-foreground hover:opacity-90",
    ghost: "text-foreground hover:bg-muted",
  }[variant];
  return <button className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition active:scale-[.98] disabled:opacity-50", v, className)} {...p}>{children}</button>;
}

export const btnClass = (variant: "primary" | "ink" | "outline" = "primary") =>
  cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition active:scale-[.98]",
    variant === "primary" && "bg-primary text-primary-foreground shadow-soft hover:brightness-105",
    variant === "ink" && "bg-ink text-ink-foreground hover:opacity-90",
    variant === "outline" && "border border-input bg-card hover:bg-muted");

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-coral">{eyebrow}</p>}
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function CategoryTile({ slug, name, icon }: { slug: string; name: string; icon: string }) {
  return (
    <Link to="/category/$slug" params={{ slug }} className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 text-center lift">
      <span className="grid size-14 place-items-center rounded-2xl bg-saffron-soft text-ink transition group-hover:bg-primary">
        <DynIcon name={icon} className="size-6" strokeWidth={1.75} />
      </span>
      <span className="text-sm font-semibold leading-tight">{name}</span>
    </Link>
  );
}

export function MiniBusinessCard({ b }: { b: Business }) {
  return (
    <Link to="/business/$id" params={{ id: b.id }} className="block w-72 shrink-0 overflow-hidden rounded-2xl border bg-card lift">
      <div className="relative aspect-[4/3]">
        <img src={b.image} alt={b.gallery?.length ? b.name : `${getCategory(b.category)?.name ?? "Business"} placeholder graphic`} loading="lazy" width={944} height={704} className="size-full object-cover" />
        {b.open && <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-success-foreground">Open now</span>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold leading-snug">{b.name}</h3>
          <RatingBadge rating={b.rating} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{b.sub} · {b.area}, {b.city}</p>
        <p className="mt-2 text-sm font-semibold">{b.price}</p>
      </div>
    </Link>
  );
}

export function BusinessCard({ b }: { b: Business }) {
  const cat = getCategory(b.category);
  const call = phoneHref(b.phone);
  const whatsapp = whatsappUrl(b.whatsapp);
  return (
    <article className="flex flex-col gap-4 rounded-3xl border bg-card p-4 shadow-soft sm:flex-row">
      <Link to="/business/$id" params={{ id: b.id }} className="relative shrink-0 overflow-hidden rounded-2xl sm:w-56">
        <img src={b.image} alt={b.gallery?.length ? b.name : `${cat?.name ?? "Business"} placeholder graphic`} loading="lazy" width={944} height={704} className="aspect-[4/3] size-full object-cover transition hover:scale-105" />
        {b.sponsored && <span className="absolute left-2 top-2 rounded-md bg-ink/85 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-foreground">Sponsored</span>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/business/$id" params={{ id: b.id }} className="text-lg font-bold hover:underline">{b.name}</Link>
          {b.verified && <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success"><BadgeCheck className="size-3.5" />Verified</span>}
          {b.trust && <span className="inline-flex items-center gap-1 rounded-full bg-saffron-soft px-2 py-0.5 text-xs font-bold text-ink"><ShieldCheck className="size-3.5" />Trust</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
          <RatingBadge rating={b.rating} />
          <span className="font-semibold">{b.reviews.toLocaleString("en-IN")} ratings</span>
          {b.years > 0 && <span className="text-muted-foreground">· {b.years} yrs in business</span>}
        </div>
        <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" />{b.area}, {b.city}{Number.isFinite(b.distance) && ` · ${b.distance} km`}</p>
        {!b.gallery?.length && <p className="text-xs text-muted-foreground">Photo pending · Category placeholder</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{cat?.name} · {b.sub}</span>
          {b.tags.slice(0, 4).map((t) => <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{t}</span>)}
        </div>
        {b.services.length > 0 && <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{b.services.slice(0, 3).map((service) => <span key={service.name} className="rounded-lg border px-2 py-1">{service.name}{service.price && ` · ${service.price}`}</span>)}</div>}
        {b.highlight && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.highlight}</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          {call && <a href={call} className={btnClass("ink")}><Phone className="size-4" />Call</a>}
          {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className={cn(btnClass("outline"), "text-success")}><MessageCircle className="size-4" />WhatsApp</a>}
          <Link to="/business/$id" params={{ id: b.id }} hash="enquire" className={btnClass("primary")}><Send className="size-4" />Get best price</Link>
        </div>
      </div>
    </article>
  );
}

export function EnquiryForm({ title = "Get the best price", subtitle, cta = "Send enquiry", businessId, businessIds, initialMessage = "", onSent, unframed = false }: { title?: string; subtitle?: string; cta?: string; businessId?: string | undefined; businessIds?: string[]; initialMessage?: string; onSent?: () => void; unframed?: boolean }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!/^[6-9]\d{9}$/.test(phone)) { toast.error("Please enter a valid 10-digit mobile number"); return; }
        const targets = [...new Set([...(businessId ? [businessId] : []), ...(businessIds ?? [])])].slice(0, 5);
        if (!targets.length) { toast.error("No matching businesses available. Please select a listing first."); return; }
        setBusy(true);
        try {
          const { error } = await supabase.from("leads").insert(targets.map((id) => ({ business_id: id, name: name.trim(), phone, message: msg.trim() })));
          if (error) { toast.error("Couldn't send your enquiry. Please try again."); return; }
          toast.success(`Enquiry sent to ${targets.length} ${targets.length === 1 ? "business" : "businesses"}.`);
          setPhone(""); setName(""); setMsg("");
          onSent?.();
        } catch {
          toast.error("Couldn't send your enquiry. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
      className={unframed ? "space-y-3" : "rounded-3xl border bg-card p-5 shadow-soft"}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4 space-y-3">
        <input required aria-label="Your name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
        <div className="flex h-11 overflow-hidden rounded-xl border border-input bg-background">
          <span className="grid place-items-center border-r px-3 text-sm font-semibold text-muted-foreground">+91</span>
          <input required aria-label="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Mobile number" className="min-w-0 w-full bg-transparent px-3 text-sm outline-none" />
        </div>
        <textarea aria-label="Your requirement" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000} rows={3} placeholder="What do you need? (optional)" className="w-full rounded-xl border border-input bg-background p-3 text-sm" />
        <Btn type="submit" disabled={busy || (!businessId && !businessIds?.length)} className="w-full">{busy ? "Sending…" : cta}</Btn>
        <p className="text-center text-xs text-muted-foreground">{businessId ? "Sent to this business" : `Shared with up to ${Math.min(5, businessIds?.length ?? 0)} matching businesses`} · No spam</p>
      </div>
    </form>
  );
}
