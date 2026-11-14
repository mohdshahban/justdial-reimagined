import { describe, expect, it } from "vitest";
import { CITIES, categoryImage, searchBusinesses, type Business } from "./catalog";

const base = { category: "restaurants", sub: "Dining", tags: [], sponsored: false, rating: 0, reviews: 0, years: 0, verified: false, trust: false, open: false, hours: "", distance: Infinity, phone: "", image: "", highlight: "", price: "", services: [], reviewList: [] };
const rows: Business[] = [
  { ...base, id: "noida", name: "The Culinary Court", city: "Noida", area: "Sector 62" },
  { ...base, id: "mumbai", name: "Mumbai Dining", city: "Mumbai", area: "Bandra" },
];
describe("Noida search", () => {
  it("includes Noida as a selectable city", () => expect(CITIES.includes("Noida")).toBe(true));
  it("shows only Noida businesses for a Noida category search", () => expect(searchBusinesses("Restaurants", "Noida", rows).map(b => b.id)).toEqual(["noida"]));
  it("keeps the city filter for an empty search", () => expect(searchBusinesses("", "Noida", rows).map(b => b.id)).toEqual(["noida"]));
  it("uses an original, category-specific placeholder when no business photo is supplied", () => {
    const placeholder = categoryImage("interior");
    expect(placeholder).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(placeholder)).toContain("Interior Designers");
    expect(decodeURIComponent(placeholder)).toContain("Business photo pending");
  });
});
