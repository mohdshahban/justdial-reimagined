import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { CATEGORIES, CITIES } from "@/data/catalog";
import { Btn } from "@/components/site/ui";
import { MAX_PHOTOS, photoUrls, uploadPhoto } from "@/lib/photos";
import type { Service } from "@/lib/public-data";
import { cn } from "@/lib/utils";
import { inputCls } from "./shell";
import { ListingAiAssistant } from "./listing-ai-assistant";
import { isBusinessPhone } from "@/lib/business-phone";

type Row = Tables<"businesses">;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PAYMENTS = ["Cash", "UPI", "Debit card", "Credit card", "Net banking", "EMI"];

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-3xl border bg-card p-5 sm:col-span-2">
      <legend className="px-2 font-display text-lg font-bold">{title}</legend>
      {hint && <p className="-mt-1 mb-4 text-sm text-muted-foreground">{hint}</p>}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
function L({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={cn("block text-sm font-semibold", wide && "sm:col-span-2")}>{label}<div className="mt-1 font-normal">{children}</div></label>;
}
function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return <button type="button" key={o} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
          className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold transition", on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>{o}</button>;
      })}
    </div>
  );
}

export type ListingPrefill = { name: string; phone: string; city: string; cat: string };
export function BusinessForm({ initial, prefill, ownerId, onDone }: { initial?: Row | undefined; prefill?: ListingPrefill; ownerId: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: initial?.name ?? prefill?.name ?? "", category: initial?.category ?? prefill?.cat ?? "restaurants", sub: initial?.sub ?? "", city: initial?.city ?? prefill?.city ?? "Noida",
    area: initial?.area ?? "", address: initial?.address ?? "", landmark: initial?.landmark ?? "", pincode: initial?.pincode ?? "",
    phone: initial?.phone ?? prefill?.phone ?? "", whatsapp: initial?.whatsapp ?? "", email: initial?.email ?? "", website: initial?.website ?? "",
    price: initial?.price ?? "", hours: initial?.hours ?? "", description: initial?.description ?? "",
    tags: (initial?.tags ?? []).join(", "), year: initial?.year_established ? String(initial.year_established) : "",
  });
  const [days, setDays] = useState<string[]>(initial?.days_open ?? []);
  const [payments, setPayments] = useState<string[]>(initial?.payment_methods ?? []);
  const [services, setServices] = useState<Service[]>(Array.isArray(initial?.services) ? (initial!.services as Service[]) : []);
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [logo, setLogo] = useState<string | null>(initial?.logo ?? null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const cat = CATEGORIES.find((c) => c.slug === f.category);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const digits = (k: keyof typeof f, n: number) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value.replace(/\D/g, "").slice(0, n) });

  useEffect(() => { photoUrls([...(initial?.photos ?? []), initial?.logo ?? ""]).then(setUrls); }, [initial]);

  const upload = async (files: FileList | null, kind: "photos" | "logo") => {
    if (!files?.length) return;
    const list = kind === "logo" ? [files[0]!] : Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (kind === "photos" && !list.length) { toast.error(`You can add up to ${MAX_PHOTOS} photos`); return; }
    setUploading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? ownerId;
      const paths: string[] = [];
      for (const file of list) {
        const p = await uploadPhoto(file, uid);
        paths.push(p);
        setUrls((u) => ({ ...u, [p]: URL.createObjectURL(file) }));
      }
      if (kind === "logo") setLogo(paths[0]!); else setPhotos((x) => [...x, ...paths]);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBusinessPhone(f.phone)) { toast.error("Enter a valid mobile number or landline with its area code"); return; }
    if (f.whatsapp && !/^[6-9]\d{9}$/.test(f.whatsapp)) { toast.error("Enter a valid WhatsApp number"); return; }
    if (f.pincode && !/^\d{6}$/.test(f.pincode)) { toast.error("Pincode must be 6 digits"); return; }
    const year = f.year ? Number(f.year) : null;
    if (year && (year < 1800 || year > new Date().getFullYear())) { toast.error("Enter a valid year of establishment"); return; }
    if (f.hours && !days.length) { toast.error("Select open days when providing opening hours"); return; }
    setBusy(true);
    const { year: _y, tags, ...rest } = f;
    const website = f.website.trim() && !/^https?:\/\//.test(f.website.trim()) ? `https://${f.website.trim()}` : f.website.trim();
    const payload = {
      ...rest, name: f.name.trim(), website, email: f.email.trim(), year_established: year,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8),
      days_open: DAYS.filter((d) => days.includes(d)), payment_methods: payments, photos, logo,
      services: services.map((s) => ({ name: s.name.trim(), price: s.price.trim() })).filter((s) => s.name).slice(0, 30),
    };
    const { error } = initial
      ? await supabase.from("businesses").update(payload).eq("id", initial.id)
      : await supabase.from("businesses").insert({ ...payload, owner_id: ownerId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial ? "Changes saved" : "Business submitted for review. It goes live once approved.");
    qc.invalidateQueries();
    onDone();
  };

  const move = (i: number) => setPhotos((p) => [p[i]!, ...p.filter((_, k) => k !== i)]);

  return (
    <form onSubmit={save} className="grid gap-5">
      <Section title="Basic details">
        <L label="Business name" wide><input required maxLength={100} value={f.name} onChange={set("name")} className={inputCls} /></L>
        <L label="Category"><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value, sub: "" })} className={inputCls}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></L>
        <L label="Speciality"><select value={f.sub} onChange={set("sub")} className={inputCls}><option value="">Choose…</option>{cat?.subs.map((s) => <option key={s}>{s}</option>)}</select></L>
        <L label="Year established"><input inputMode="numeric" placeholder="e.g. 2012" value={f.year} onChange={digits("year", 4)} className={inputCls} /></L>
        <L label="Price range (e.g. ₹500 for two)"><input maxLength={60} value={f.price} onChange={set("price")} className={inputCls} /></L>
        <L label="About your business" wide><textarea aria-label="About your business" rows={4} maxLength={1500} value={f.description} onChange={set("description")} className="w-full rounded-xl border border-input bg-background p-3 text-sm" /></L>
        <L label="Highlights (comma separated)" wide><input maxLength={200} value={f.tags} onChange={set("tags")} placeholder="Home delivery, Parking, AC" className={inputCls} /></L>
      </Section>

      <Section title="AI profile assistant">
        <ListingAiAssistant details={{
          name: f.name, category: cat?.name ?? f.category, sub: f.sub, city: f.city, area: f.area,
          description: f.description, highlights: f.tags, year: f.year, price: f.price, hours: f.hours,
          days, payments, services, photoCount: photos.length, hasLogo: Boolean(logo),
          hasAddress: Boolean(f.address.trim()), hasLandmark: Boolean(f.landmark.trim()), hasPincode: Boolean(f.pincode.trim()),
          hasPhone: Boolean(f.phone.trim()), hasWhatsapp: Boolean(f.whatsapp.trim()), hasEmail: Boolean(f.email.trim()), hasWebsite: Boolean(f.website.trim()),
        }} onApply={(description) => setF((current) => ({ ...current, description }))} />
      </Section>

      <Section title="Photos & logo" hint={`Add up to ${MAX_PHOTOS} photos (max 5 MB each). The starred photo is the cover shown in search results.`}>
        <div className="sm:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p, i) => (
              <div key={p} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
                {urls[p] ? <img src={urls[p]} alt={`Photo ${i + 1}`} className="size-full object-cover" /> : <div className="grid size-full place-items-center"><Loader2 className="size-5 animate-spin" /></div>}
                {i === 0 ? <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">Cover</span>
                  : <button type="button" onClick={() => move(i)} aria-label="Make cover" className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 shadow"><Star className="size-4" /></button>}
                <button type="button" onClick={() => setPhotos((x) => x.filter((y) => y !== p))} aria-label="Remove photo" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 shadow"><X className="size-4" /></button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" disabled={uploading} onClick={() => photoInput.current?.click()} className="grid aspect-[4/3] place-items-center rounded-2xl border-2 border-dashed text-sm font-semibold text-muted-foreground hover:bg-muted">
                <span className="flex flex-col items-center gap-1">{uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}{uploading ? "Uploading…" : "Add photos"}</span>
              </button>
            )}
          </div>
          <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files, "photos"); e.target.value = ""; }} />
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-muted">{logo && urls[logo] ? <img src={urls[logo]} alt="Logo" className="size-full object-cover" /> : <ImagePlus className="size-6 text-muted-foreground" />}</div>
          <div className="flex flex-wrap gap-2">
            <Btn type="button" variant="outline" disabled={uploading} onClick={() => logoInput.current?.click()}>{logo ? "Change logo" : "Upload logo"}</Btn>
            {logo && <Btn type="button" variant="outline" onClick={() => setLogo(null)}>Remove</Btn>}
          </div>
          <input ref={logoInput} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files, "logo"); e.target.value = ""; }} />
        </div>
      </Section>

      <Section title="Location">
        <L label="City"><select value={f.city} onChange={set("city")} className={inputCls}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></L>
        <L label="Area / locality"><input required maxLength={80} value={f.area} onChange={set("area")} className={inputCls} /></L>
        <L label="Full address" wide><input maxLength={200} value={f.address} onChange={set("address")} placeholder="Shop no., building, street" className={inputCls} /></L>
        <L label="Landmark"><input maxLength={100} value={f.landmark} onChange={set("landmark")} placeholder="Near…" className={inputCls} /></L>
        <L label="Pincode"><input inputMode="numeric" value={f.pincode} onChange={digits("pincode", 6)} className={inputCls} /></L>
      </Section>

      <Section title="Contact">
        <L label="Business phone (mobile or landline)"><input required inputMode="numeric" value={f.phone} onChange={digits("phone", 11)} className={inputCls} /></L>
        <L label="WhatsApp number"><input inputMode="numeric" value={f.whatsapp} onChange={digits("whatsapp", 10)} placeholder="Optional" className={inputCls} /></L>
        <L label="Email"><input type="email" maxLength={120} value={f.email} onChange={set("email")} placeholder="Optional" className={inputCls} /></L>
        <L label="Website"><input maxLength={200} value={f.website} onChange={set("website")} placeholder="www.example.com" className={inputCls} /></L>
      </Section>

      <Section title="Timings & payments">
        <L label="Open on" wide><Chips options={DAYS} value={days} onChange={setDays} /></L>
        <L label="Opening hours"><input maxLength={60} value={f.hours} onChange={set("hours")} className={inputCls} /></L>
        <div />
        <L label="Payment methods accepted" wide><Chips options={PAYMENTS} value={payments} onChange={setPayments} /></L>
      </Section>

      <Section title="Services & prices" hint="Shown on the Services tab of your listing.">
        <div className="space-y-2 sm:col-span-2">
          {services.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input aria-label="Service name" maxLength={80} value={s.name} placeholder="Service, e.g. AC gas refill" onChange={(e) => setServices(services.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} className={inputCls} />
              <input aria-label="Price" maxLength={30} value={s.price} placeholder="₹ price" onChange={(e) => setServices(services.map((x, k) => k === i ? { ...x, price: e.target.value } : x))} className={cn(inputCls, "max-w-36")} />
              <button type="button" aria-label="Remove service" onClick={() => setServices(services.filter((_, k) => k !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl border hover:bg-muted"><Trash2 className="size-4" /></button>
            </div>
          ))}
          <Btn type="button" variant="outline" onClick={() => setServices([...services, { name: "", price: "" }])}><Plus className="size-4" />Add service</Btn>
        </div>
      </Section>

      <div className="flex justify-end gap-2"><Btn type="button" variant="outline" onClick={onDone}>Cancel</Btn><Btn type="submit" disabled={busy || uploading}>{busy ? "Saving…" : initial ? "Save changes" : "Submit listing"}</Btn></div>
    </form>
  );
}
