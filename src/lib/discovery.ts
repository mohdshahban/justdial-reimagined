/** Public-directory helpers. Unknown business facts must stay unknown. */
export type Coordinates = { lat: number; lng: number };

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function parseCoordinates(value: unknown): Coordinates | undefined {
  if (!value || typeof value !== "object") return undefined;
  const object = value as Record<string, unknown>;
  const nested = object.coordinates ?? object.location;
  if (nested && nested !== value) {
    const result = parseCoordinates(nested);
    if (result) return result;
  }
  const lat = Number(Array.isArray(value) ? value[0] : object.lat ?? object.latitude);
  const lng = Number(Array.isArray(value) ? value[1] : object.lng ?? object.lon ?? object.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return undefined;
  return { lat, lng };
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h))) * 10) / 10;
}

/** Returns a 10-digit Indian mobile number, or undefined if not provided/valid. */
export function mobileDigits(value?: string | null): string | undefined {
  const digits = (value ?? "").replace(/\D/g, "").replace(/^91(?=[6-9]\d{9}$)/, "").replace(/^0(?=[6-9]\d{9}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : undefined;
}

export function phoneHref(value?: string | null): string | undefined {
  const raw = (value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return undefined;
  return `tel:${raw.startsWith("+") ? "+" : ""}${digits}`;
}

export function whatsappUrl(value?: string | null): string | undefined {
  const digits = mobileDigits(value);
  return digits ? `https://wa.me/91${digits}` : undefined;
}

export function directionsUrl(address: string, coords?: Coordinates): string {
  const query = coords ? `${coords.lat},${coords.lng}` : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function timeOfDay(hour: string, minute: string | undefined, period: string | undefined): number | null {
  let h = Number(hour);
  const m = Number(minute ?? "0");
  if (h > 24 || m > 59 || (period && h > 12)) return null;
  if (period) h = h % 12 + (period.toLowerCase() === "pm" ? 12 : 0);
  return h * 60 + m;
}

/** Returns null when hours are absent or ambiguous. Uses Indian local time. */
export function openNow(hours: string | undefined, days: string[] | undefined, now = new Date()): boolean | null {
  const raw = (hours ?? "").trim();
  if (!raw) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const find = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const today = WEEKDAYS.indexOf(find("weekday"));
  if (today < 0) return null;
  const current = Number(find("hour")) * 60 + Number(find("minute"));
  const openDays = (days ?? []).map((day) => WEEKDAYS.findIndex((d) => day.toLowerCase().startsWith(d.toLowerCase()))).filter((n) => n >= 0);
  const listedToday = openDays.length === 0 || openDays.includes(today);
  if (/\b(24\s*(hours?|hrs?)|24\s*\/\s*7)\b/i.test(raw)) return listedToday;

  const cleaned = raw.replace(/[–—−]/g, "-").replace(/\s+to\s+/gi, "-");
  const range = cleaned.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!range) return null;
  const [, sh, sm, sp, eh, em, ep] = range;
  // Do not guess whether '10-8' means morning or evening.
  if ((!sp || !ep) && Number(sh) <= 12 && Number(eh) <= 12) return null;
  const start = timeOfDay(sh, sm, sp);
  const end = timeOfDay(eh, em, ep);
  if (start === null || end === null) return null;
  if (end > start) return listedToday && current >= start && current < end;
  const yesterday = (today + 6) % 7;
  const listedYesterday = openDays.length === 0 || openDays.includes(yesterday);
  return (listedToday && current >= start) || (listedYesterday && current < end);
}
