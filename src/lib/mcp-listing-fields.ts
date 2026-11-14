/**
 * Shared MCP mapping for the public fields in BusinessForm. Keep this in sync
 * with src/components/dash/business-form.tsx; never expose approval, owner,
 * verification, plan or sponsored flags through these schemas.
 */
import { z } from "zod";
import { CATEGORIES, CITIES } from "@/data/catalog";
import { isBusinessPhone } from "./business-phone";
import { photoPathSchema } from "./photo-access";
import { MCP_IMAGE_LIMIT } from "./mcp-image";

export const OPEN_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Debit card",
  "Credit card",
  "Net banking",
  "EMI",
] as const;

const optionalPhone = z
  .string()
  .trim()
  .max(11)
  .refine(
    (v) => !v || isBusinessPhone(v),
    "Use a valid 10-digit Indian mobile number or 11-digit landline with area code",
  );
const optionalWhatsapp = z
  .string()
  .trim()
  .max(10)
  .refine((v) => !v || /^[6-9]\d{9}$/.test(v), "WhatsApp must be a 10-digit Indian mobile number");
const optionalPincode = z
  .string()
  .trim()
  .max(6)
  .refine((v) => !v || /^\d{6}$/.test(v), "Pincode must have 6 digits");
const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email address");
const optionalWebsite = z
  .string()
  .trim()
  .max(200)
  .refine(
    (v) => !v || (/^https?:\/\//i.test(v) && z.string().url().safeParse(v).success),
    "Website must be a full http(s) URL",
  );

const uniqueArray = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z
    .array(item)
    .max(max)
    .refine((items) => new Set(items).size === items.length, "Duplicate values are not allowed");

export const LISTING_FIELDS = {
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(120),
  sub: z.string().trim().max(80),
  year_established: z.number().int().min(1800).max(new Date().getFullYear()).nullable(),
  price: z.string().trim().max(60),
  description: z.string().trim().max(1500),
  tags: uniqueArray(z.string().trim().min(1).max(60), 8),
  city: z.string().trim().min(2).max(120),
  area: z.string().trim().max(80),
  address: z.string().trim().max(200),
  landmark: z.string().trim().max(100),
  pincode: optionalPincode,
  phone: optionalPhone,
  whatsapp: optionalWhatsapp,
  email: optionalEmail,
  website: optionalWebsite,
  days_open: uniqueArray(z.enum(OPEN_DAYS), 7).refine(
    (items) => items.length > 0,
    "Pick at least one open day",
  ),
  hours: z.string().trim().max(60),
  payment_methods: uniqueArray(z.enum(PAYMENT_METHODS), 6),
  services: z
    .array(
      z
        .object({ name: z.string().trim().min(1).max(80), price: z.string().trim().max(30) })
        .strict(),
    )
    .max(30),
  photos: uniqueArray(photoPathSchema, 10),
  logo: photoPathSchema.nullable(),
};

const optionalListingFields = {
  name: LISTING_FIELDS.name.optional(),
  category: LISTING_FIELDS.category.optional(),
  sub: LISTING_FIELDS.sub.optional(),
  year_established: LISTING_FIELDS.year_established.optional(),
  price: LISTING_FIELDS.price.optional(),
  description: LISTING_FIELDS.description.optional(),
  tags: LISTING_FIELDS.tags.optional(),
  city: LISTING_FIELDS.city.optional(),
  area: LISTING_FIELDS.area.optional(),
  address: LISTING_FIELDS.address.optional(),
  landmark: LISTING_FIELDS.landmark.optional(),
  pincode: LISTING_FIELDS.pincode.optional(),
  phone: LISTING_FIELDS.phone.optional(),
  whatsapp: LISTING_FIELDS.whatsapp.optional(),
  email: LISTING_FIELDS.email.optional(),
  website: LISTING_FIELDS.website.optional(),
  days_open: LISTING_FIELDS.days_open.optional(),
  hours: LISTING_FIELDS.hours.optional(),
  payment_methods: LISTING_FIELDS.payment_methods.optional(),
  services: LISTING_FIELDS.services.optional(),
  photos: LISTING_FIELDS.photos.optional(),
  logo: LISTING_FIELDS.logo.optional(),
};

export const businessDraftInput = {
  ...optionalListingFields,
  name: LISTING_FIELDS.name,
  category: LISTING_FIELDS.category,
  city: LISTING_FIELDS.city,
};

export const businessUpdateInput = {
  business_id: z.string().uuid(),
  changes: z
    .object(optionalListingFields)
    .strict()
    .refine((value) => Object.keys(value).length > 0, "Supply at least one listing field"),
};

export function normalizeCategory(input: string): string {
  const value = input.trim().toLowerCase();
  const found = CATEGORIES.find(
    (c) => c.slug.toLowerCase() === value || c.name.toLowerCase() === value,
  );
  if (!found)
    throw new Error(
      `Unknown category: ${input}. Call get_listing_form_options for supported names/slugs.`,
    );
  return found.slug;
}

export function normalizeCity(input: string): string {
  const found = CITIES.find((city) => city.toLowerCase() === input.trim().toLowerCase());
  if (!found)
    throw new Error(`Unknown city: ${input}. Call get_listing_form_options for supported cities.`);
  return found;
}

export function validateSpeciality(category: string, sub: string): void {
  if (!sub) return;
  const supported = CATEGORIES.find((c) => c.slug === category)?.subs ?? [];
  if (!supported.includes(sub))
    throw new Error(`Speciality must be one of: ${supported.join(", ") || "(none)"}`);
}

export function listingFormOptions() {
  return {
    categories: CATEGORIES.map(({ slug, name, subs }) => ({ slug, name, specialities: subs })),
    cities: [...CITIES],
    days_open: [...OPEN_DAYS],
    payment_methods: [...PAYMENT_METHODS],
    max_photos: 10,
    photo_limit_bytes: 5 * 1024 * 1024,
    mcp_image_limit_bytes: MCP_IMAGE_LIMIT,
    fields: Object.keys(LISTING_FIELDS),
    form_required_fields: ["name", "category", "city", "area", "phone"],
    draft_required_fields: ["name", "category", "city"],
    note: "Incomplete businesses may be saved as pending drafts. Never invent missing contacts, locality, prices or opening times.",
  };
}
