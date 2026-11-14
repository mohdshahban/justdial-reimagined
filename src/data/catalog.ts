import restaurant from "@/assets/biz-restaurant.jpg";
import clinic from "@/assets/biz-clinic.jpg";
import repair from "@/assets/biz-repair.jpg";
import type { Coordinates } from "@/lib/discovery";

export const CITIES = ["Noida", "Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"] as const;
export type City = (typeof CITIES)[number];

export type Category = { slug: string; name: string; icon: string; group: string; subs: string[] };

export const CATEGORIES: Category[] = [
  { slug: "restaurants", name: "Restaurants", icon: "UtensilsCrossed", group: "Food", subs: ["North Indian", "South Indian", "Chinese", "Cafes", "Pure Veg", "Biryani"] },
  { slug: "doctors", name: "Doctors", icon: "Stethoscope", group: "Health", subs: ["General Physician", "Dentist", "Dermatologist", "Paediatrician", "Gynaecologist"] },
  { slug: "ac-repair", name: "AC Repair", icon: "AirVent", group: "Home services", subs: ["Split AC", "Window AC", "Gas Refill", "Installation"] },
  { slug: "beauty-spa", name: "Beauty & Spa", icon: "Sparkles", group: "Lifestyle", subs: ["Salons", "Bridal Makeup", "Spa", "Nail Art"] },
  { slug: "hotels", name: "Hotels", icon: "BedDouble", group: "Travel", subs: ["Budget", "3 Star", "5 Star", "Resorts"] },
  { slug: "packers-movers", name: "Packers & Movers", icon: "Truck", group: "Home services", subs: ["Local Shifting", "Intercity", "Office Relocation"] },
  { slug: "gyms", name: "Gyms", icon: "Dumbbell", group: "Lifestyle", subs: ["Unisex", "CrossFit", "Yoga", "Zumba"] },
  { slug: "pg-hostels", name: "PG & Hostels", icon: "Building2", group: "Real estate", subs: ["Boys PG", "Girls PG", "Co-living"] },
  { slug: "plumbers", name: "Plumbers", icon: "Wrench", group: "Home services", subs: ["Leakage", "Bathroom Fitting", "Water Tank"] },
  { slug: "electricians", name: "Electricians", icon: "Zap", group: "Home services", subs: ["Wiring", "Inverter", "Fan & Light"] },
  { slug: "schools", name: "Schools", icon: "School", group: "Education", subs: ["CBSE", "ICSE", "Play School"] },
  { slug: "tutors", name: "Tutors", icon: "GraduationCap", group: "Education", subs: ["Maths", "IIT-JEE", "NEET", "Spoken English"] },
  { slug: "car-service", name: "Car Service", icon: "Car", group: "Auto", subs: ["Car Wash", "Denting", "Car Repair"] },
  { slug: "pest-control", name: "Pest Control", icon: "Bug", group: "Home services", subs: ["Termite", "Cockroach", "Bed Bugs"] },
  { slug: "caterers", name: "Caterers", icon: "ChefHat", group: "Food", subs: ["Wedding", "Corporate", "Birthday"] },
  { slug: "wedding", name: "Wedding Planners", icon: "Heart", group: "Events", subs: ["Venues", "Decorators", "Photographers"] },
  { slug: "pharmacy", name: "Chemists", icon: "Pill", group: "Health", subs: ["24 Hours", "Ayurvedic", "Surgical"] },
  { slug: "hospitals", name: "Hospitals", icon: "Hospital", group: "Health", subs: ["Multispeciality", "Eye", "Maternity"] },
  { slug: "travel-agents", name: "Travel Agents", icon: "Plane", group: "Travel", subs: ["Domestic", "International", "Visa"] },
  { slug: "car-rental", name: "Car Rental", icon: "CarFront", group: "Travel", subs: ["Self Drive", "Outstation", "Airport"] },
  { slug: "real-estate", name: "Real Estate Agents", icon: "House", group: "Real estate", subs: ["Rent", "Buy", "Commercial"] },
  { slug: "furniture", name: "Furniture", icon: "Sofa", group: "Shopping", subs: ["Sofa", "Beds", "Office"] },
  { slug: "electronics", name: "Mobile & Electronics", icon: "Smartphone", group: "Shopping", subs: ["Mobiles", "Laptops", "Repair"] },
  { slug: "jewellers", name: "Jewellers", icon: "Gem", group: "Shopping", subs: ["Gold", "Diamond", "Silver"] },
  { slug: "lawyers", name: "Lawyers", icon: "Scale", group: "Professional", subs: ["Civil", "Criminal", "Property"] },
  { slug: "ca", name: "Chartered Accountants", icon: "Calculator", group: "Professional", subs: ["GST", "Income Tax", "Audit"] },
  { slug: "courier", name: "Courier Services", icon: "Package", group: "Professional", subs: ["Domestic", "International"] },
  { slug: "interior", name: "Interior Designers", icon: "Paintbrush", group: "Home services", subs: ["Modular Kitchen", "Residential", "Office"] },
  { slug: "pet-shops", name: "Pet Shops", icon: "PawPrint", group: "Lifestyle", subs: ["Pet Food", "Grooming", "Vets"] },
  { slug: "dance", name: "Dance Classes", icon: "Music", group: "Education", subs: ["Bollywood", "Classical", "Hip Hop"] },
  { slug: "wholesale", name: "Wholesalers", icon: "Warehouse", group: "B2B", subs: ["Garments", "FMCG", "Hardware"] },
  { slug: "manufacturers", name: "Manufacturers", icon: "Factory", group: "B2B", subs: ["Machinery", "Packaging", "Textiles"] },
];

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

export const TRENDING = ["Restaurants", "AC Repair", "Dentists", "Packers & Movers", "PG", "Gyms", "Beauty & Spa", "Plumbers"];

export type Review = { name: string; rating: number; date: string; text: string };
export type Business = {
  id: string; name: string; category: string; sub: string; city: City; area: string;
  rating: number; reviews: number; years: number; verified: boolean; trust: boolean; sponsored: boolean;
  open: boolean; hours: string; distance: number; phone: string; image: string; tags: string[];
  openKnown?: boolean; coords?: Coordinates;
  highlight: string; price: string; services: { name: string; price: string }[]; reviewList: Review[];
  live?: boolean; description?: string; address?: string;
  gallery?: string[]; logo?: string | undefined; website?: string; email?: string; whatsapp?: string; landmark?: string; pincode?: string; payments?: string[]; days?: string[];
};

// Approved listings without owner-provided photos receive a clearly labelled
// original graphic, never a stock image that looks like the actual premises.
export const categoryImage = (slug: string) => {
  const escapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
  const title = (getCategory(slug)?.name ?? "Local business").replace(/[&<>"']/g, (char) => escapes[char] ?? char);
  const graphic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${title} placeholder graphic">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff8eb"/><stop offset="1" stop-color="#f4dabb"/></linearGradient></defs>
    <rect width="800" height="600" fill="url(#g)"/><circle cx="735" cy="95" r="160" fill="#f3be81" opacity=".4"/><circle cx="70" cy="550" r="200" fill="#edcc9a" opacity=".45"/>
    <rect x="210" y="195" width="380" height="220" rx="18" fill="#fff" stroke="#d3ae81" stroke-width="7"/>
    <path d="M200 203h400l-34-80H234z" fill="#f4a63a" stroke="#b36e28" stroke-width="6" stroke-linejoin="round"/>
    <path d="M200 203h400" stroke="#fff8eb" stroke-width="14" stroke-dasharray="44 42"/>
    <rect x="250" y="247" width="116" height="168" rx="7" fill="#f5e6d2"/><rect x="412" y="247" width="134" height="100" rx="8" fill="#f5e6d2"/>
    <text x="400" y="488" font-family="Arial,sans-serif" font-size="35" font-weight="700" fill="#1c2b45" text-anchor="middle">${title}</text>
    <text x="400" y="530" font-family="Arial,sans-serif" font-size="20" fill="#745e52" text-anchor="middle">Business photo pending</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(graphic)}`;
};

const AREAS: Record<City, string[]> = {
  Noida: ["Sector 27", "Sector 50", "Sector 62", "Sector 90", "Sector 128"],
  Mumbai: ["Andheri West", "Bandra", "Powai", "Dadar", "Colaba"],
  Delhi: ["Connaught Place", "Saket", "Karol Bagh", "Dwarka", "Lajpat Nagar"],
  Bengaluru: ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar"],
  Chennai: ["T Nagar", "Adyar", "Anna Nagar", "Velachery", "Mylapore"],
  Hyderabad: ["Banjara Hills", "Gachibowli", "Madhapur", "Kukatpally", "Begumpet"],
  Pune: ["Koregaon Park", "Kothrud", "Viman Nagar", "Baner", "Hinjewadi"],
  Kolkata: ["Park Street", "Salt Lake", "Ballygunge", "New Town", "Gariahat"],
  Ahmedabad: ["Navrangpura", "Satellite", "Bopal", "Prahlad Nagar", "Maninagar"],
};

const SEED: { cat: string; names: string[]; img: string; services: [string, string][]; tags: string[]; price: string }[] = [
  { cat: "restaurants", img: restaurant, price: "₹600 for two", tags: ["Pure Veg options", "Home delivery", "Family dining"],
    names: ["Saffron Thali House", "Masala Junction", "The Biryani Co.", "Udupi Grand", "Chai & Chaat Cafe", "Coastal Curry Kitchen"],
    services: [["Gujarati Thali", "₹349"], ["Hyderabadi Biryani", "₹299"], ["Masala Dosa", "₹129"], ["Paneer Tikka", "₹249"]] },
  { cat: "doctors", img: clinic, price: "₹500 consultation", tags: ["Online consult", "Insurance accepted", "Female doctor"],
    names: ["Aarogya Clinic", "Dr. Mehta's Dental Care", "SkinFirst Dermatology", "LittleSteps Child Clinic", "CarePlus Family Physician", "Smile Studio Dental"],
    services: [["General Consultation", "₹500"], ["Teeth Cleaning", "₹1,200"], ["Skin Consultation", "₹800"], ["Health Checkup", "₹1,999"]] },
  { cat: "ac-repair", img: repair, price: "Starts ₹399", tags: ["Same day service", "90-day warranty", "All brands"],
    names: ["CoolTech AC Services", "Chill Point Repairs", "FrostFix Engineers", "Arctic Air Solutions", "Breeze Care", "PolarPro AC"],
    services: [["AC Service (Split)", "₹499"], ["Gas Refill", "₹2,499"], ["Installation", "₹1,499"], ["Uninstallation", "₹699"]] },
  { cat: "beauty-spa", img: clinic, price: "Starts ₹299", tags: ["Unisex", "Bridal packages", "Hygiene certified"],
    names: ["Glow Studio Salon", "Kesh Kala Unisex", "Lotus Day Spa", "The Mirror Lounge"],
    services: [["Haircut", "₹399"], ["Facial", "₹1,199"], ["Bridal Makeup", "₹15,000"], ["Full Body Massage", "₹2,499"]] },
  { cat: "packers-movers", img: repair, price: "Free quote", tags: ["Insured", "Packing material", "GPS tracked"],
    names: ["SafeShift Packers", "Agarwal Movers & Packers", "QuickMove Logistics", "HomeHop Relocations"],
    services: [["1 BHK Local", "₹6,999"], ["2 BHK Local", "₹11,999"], ["Car Transport", "₹8,500"], ["Intercity Shift", "On quote"]] },
  { cat: "gyms", img: clinic, price: "₹1,800/month", tags: ["Personal trainer", "Steam room", "24x7"],
    names: ["Iron Temple Fitness", "FitNation Gym", "Pulse CrossFit Box", "Shakti Yoga Studio"],
    services: [["Monthly", "₹1,800"], ["Quarterly", "₹4,999"], ["Annual", "₹14,999"], ["Personal Training", "₹6,000/mo"]] },
  { cat: "hotels", img: restaurant, price: "₹3,200/night", tags: ["Free Wi-Fi", "Breakfast included", "Couple friendly"],
    names: ["Hotel Marigold Residency", "The Banyan Inn", "Royal Orchid Suites", "Seaside Comfort Stay"],
    services: [["Deluxe Room", "₹3,200"], ["Suite", "₹6,500"], ["Airport Pickup", "₹900"], ["Banquet Hall", "On quote"]] },
  { cat: "plumbers", img: repair, price: "Visit ₹199", tags: ["Within 60 mins", "Verified pros", "Fixed rates"],
    names: ["FlowRight Plumbing", "Sharma Plumbing Works", "LeakStop Experts", "AquaFix Services"],
    services: [["Tap Repair", "₹199"], ["Leakage Fix", "₹499"], ["Bathroom Fitting", "₹2,999"], ["Tank Cleaning", "₹899"]] },
];

const REVIEWERS = ["Priya S.", "Rahul K.", "Ananya M.", "Vikram R.", "Sneha P.", "Arjun D.", "Kavya N.", "Rohan G."];
const TEXTS = [
  "Excellent service and very polite staff. Prices were exactly as quoted. Will definitely come back.",
  "Quick response on call, arrived on time and finished the job neatly. Highly recommended.",
  "Good experience overall, a little crowded on weekends but worth the wait.",
  "Very professional. They explained everything clearly and didn't push extra charges.",
  "Found them through search, booked in two minutes. Great value for money.",
];

function rand(seed: number) { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }

export const BUSINESSES: Business[] = SEED.flatMap((s, si) =>
  s.names.map((name, ni) => {
    const n = si * 10 + ni + 1;
    const city = CITIES[(si + ni) % CITIES.length]!;
    const cat = getCategory(s.cat)!;
    const rating = Math.round((3.9 + rand(n) * 1.05) * 10) / 10;
    return {
      id: `${s.cat}-${ni + 1}`,
      name, category: s.cat, sub: cat.subs[ni % cat.subs.length]!, city,
      area: AREAS[city][ni % 5]!, rating: Math.min(rating, 4.9),
      reviews: Math.floor(80 + rand(n + 3) * 4200), years: 2 + Math.floor(rand(n + 5) * 22),
      verified: rand(n + 7) > 0.25, trust: rand(n + 8) > 0.55, sponsored: ni === 0 || ni === 3,
      open: rand(n + 9) > 0.2, hours: ni % 2 ? "10:00 am – 9:00 pm" : "9:00 am – 11:00 pm",
      distance: Math.round((0.4 + rand(n + 11) * 8) * 10) / 10,
      phone: `+91 98${String(Math.floor(10000000 + rand(n + 13) * 89999999))}`,
      image: s.img, tags: s.tags, price: s.price,
      highlight: TEXTS[n % TEXTS.length]!.split(".")[0] + ".",
      services: s.services.map(([a, b]) => ({ name: a, price: b })),
      reviewList: [0, 1, 2, 3].map((k) => ({
        name: REVIEWERS[(n + k) % REVIEWERS.length]!,
        rating: 5 - ((n + k) % 3 === 0 ? 1 : 0),
        date: `${(k + 1) * 3} days ago`,
        text: TEXTS[(n + k) % TEXTS.length]!,
      })),
    } satisfies Business;
  }),
);

export const getBusiness = (id: string) => BUSINESSES.find((b) => b.id === id);

export function searchBusinesses(q = "", city?: string, list: Business[] = []) {
  const t = q.trim().toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = t.split(" ").filter(Boolean);
  const scored = list.filter((b) => !city || b.city === city).map((b) => {
    const category = getCategory(b.category)?.name.toLowerCase() ?? "";
    const name = b.name.toLowerCase();
    const searchable = [name, category, b.sub, b.area, b.description, ...b.tags, ...b.services.map((s) => s.name)]
      .filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9 ]/g, " ");
    const matches = tokens.every((token) => searchable.includes(token));
    const score = (name.includes(t) ? 6 : 0) + (category.includes(t) ? 5 : 0) +
      (b.sub.toLowerCase().includes(t) ? 3 : 0) + (b.sponsored ? 1 : 0);
    return { b, score, matches: tokens.length === 0 || matches };
  });
  return scored.filter((entry) => entry.matches).sort((a, b) => b.score - a.score || b.b.reviews - a.b.reviews).map((entry) => entry.b);
}

export const STATS = [
  { value: "17.9 Cr+", label: "people use us every quarter" },
  { value: "4.3 Cr+", label: "businesses listed" },
  { value: "11,000+", label: "cities & towns" },
  { value: "2.9 Cr+", label: "verified reviews" },
];
