import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { categoryImage, type Business, type City } from "@/data/catalog";
import { photoUrls } from "@/lib/photos";
import { openNow, parseCoordinates } from "@/lib/discovery";

type Row = Tables<"businesses"> & { reviews?: Pick<Tables<"reviews">, "name" | "rating" | "text" | "created_at" | "owner_reply">[] };
export type Service = { name: string; price: string };

export function rowToBusiness(r: Row, urls: Record<string, string> = {}): Business {
  const revs = r.reviews ?? [];
  const rating = revs.length ? Math.round((revs.reduce((a, x) => a + x.rating, 0) / revs.length) * 10) / 10 : 0;
  const gallery = r.photos.map((p) => urls[p]).filter(Boolean) as string[];
  const years = r.year_established ? Math.max(0, new Date().getFullYear() - r.year_established) : 0;
  const currentOpen = openNow(r.hours, r.days_open);
  return {
    id: r.id, name: r.name, category: r.category, sub: r.sub || "General", city: r.city as City, area: r.area,
    rating, reviews: revs.length, years,
    verified: r.verified, trust: r.plan !== "free", sponsored: r.sponsored, open: currentOpen === true, openKnown: currentOpen !== null, hours: r.hours,
    coords: parseCoordinates(r.coordinates), distance: Infinity, phone: r.phone || "", image: gallery[0] ?? categoryImage(r.category), gallery, logo: r.logo ? urls[r.logo] : undefined,
    tags: r.tags,
    highlight: r.description ? r.description.split(".")[0] + "." : "Newly listed on Justdial.", price: r.price,
    services: Array.isArray(r.services) ? (r.services as Service[]).filter((s) => s?.name) : [], live: true, description: r.description, address: r.address,
    website: r.website, email: r.email, whatsapp: r.whatsapp, landmark: r.landmark, pincode: r.pincode, payments: r.payment_methods, days: r.days_open,
    reviewList: revs.map((x) => ({ name: x.name, rating: x.rating, date: new Date(x.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), text: x.text + (x.owner_reply ? `\n\nOwner reply: ${x.owner_reply}` : "") })),
  };
}

const SELECT = "*, reviews(name, rating, text, created_at, owner_reply)";
const allPaths = (rows: Row[], galleryAll: boolean) => rows.flatMap((r) => [...(galleryAll ? r.photos : r.photos.slice(0, 1)), r.logo ?? ""]);

export const liveBusinessesQ = queryOptions({
  queryKey: ["public", "businesses"],
  queryFn: async () => {
    const { data, error } = await supabase.from("businesses").select(SELECT).eq("status", "approved").order("sponsored", { ascending: false });
    if (error) return [] as Business[];
    const rows = data as Row[];
    const urls = await photoUrls(allPaths(rows, false));
    return rows.map((r) => rowToBusiness(r, urls));
  },
  staleTime: 30_000,
});

export const liveBusinessQ = (id: string) => queryOptions({
  queryKey: ["public", "business", id],
  queryFn: async () => {
    const { data } = await supabase.from("businesses").select(SELECT).eq("id", id).eq("status", "approved").maybeSingle();
    if (!data) return null;
    const urls = await photoUrls(allPaths([data as Row], true));
    return rowToBusiness(data as Row, urls);
  },
});
