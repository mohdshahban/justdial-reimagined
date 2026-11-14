import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  businessDraftInput,
  businessUpdateInput,
  listingFormOptions,
  normalizeCategory,
  normalizeCity,
  validateSpeciality,
} from "./mcp-listing-fields";

const draft = z.object(businessDraftInput);
const update = z.object(businessUpdateInput);

describe("MCP listing form parity", () => {
  it("maps display categories to saved slugs", () => {
    expect(normalizeCategory("Interior Designers")).toBe("interior");
    expect(normalizeCategory("interior")).toBe("interior");
    expect(() => normalizeCategory("Unknown category")).toThrow(/Unknown category/);
    expect(normalizeCity("noida")).toBe("Noida");
    expect(() => normalizeCity("Not a city")).toThrow();
    expect(() => validateSpeciality("interior", "Modular Kitchen")).not.toThrow();
    expect(() => validateSpeciality("interior", "Dentist")).toThrow();
  });

  it("allows a partial pending draft without fabricating a phone or area", () => {
    expect(
      draft.safeParse({ name: "Example Interior", category: "Interior Designers", city: "Noida" })
        .success,
    ).toBe(true);
  });

  it("accepts complete admin fields and preserves blank optional service prices", () => {
    expect(
      draft.safeParse({
        name: "Example Interior",
        category: "interior",
        city: "Noida",
        area: "Sector 141",
        phone: "9876543210",
        whatsapp: "",
        pincode: "201304",
        year_established: null,
        days_open: ["Mon", "Tue"],
        payment_methods: ["Cash", "UPI"],
        services: [{ name: "Modular Kitchen", price: "" }],
        tags: ["Free Consultation"],
        photos: [],
        logo: null,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid contacts, impossible options, duplicate days and excess photos", () => {
    const fields = { name: "Example Interior", category: "interior", city: "Noida" };
    expect(draft.safeParse({ ...fields, phone: "1234" }).success).toBe(false);
    expect(draft.safeParse({ ...fields, whatsapp: "1234567890" }).success).toBe(false);
    expect(draft.safeParse({ ...fields, pincode: "123" }).success).toBe(false);
    expect(draft.safeParse({ ...fields, days_open: ["Mon", "Mon"] }).success).toBe(false);
    expect(
      draft.safeParse({
        ...fields,
        photos: Array(11).fill("00000000-0000-0000-0000-000000000000/a.jpg"),
      }).success,
    ).toBe(false);
    expect(draft.safeParse({ ...fields, website: "javascript:alert(1)" }).success).toBe(false);
  });

  it("rejects empty updates or restricted admin-only fields", () => {
    const business_id = "00000000-0000-0000-0000-000000000001";
    expect(update.safeParse({ business_id, changes: {} }).success).toBe(false);
    expect(update.safeParse({ business_id, changes: { status: "approved" } }).success).toBe(false);
    expect(
      update.safeParse({ business_id, changes: { services: [{ name: "Ceiling", price: "" }] } })
        .success,
    ).toBe(true);
  });

  it("advertises every editable field and the genuine mandatory form fields", () => {
    const options = listingFormOptions();
    expect(options.form_required_fields).toEqual(["name", "category", "city", "area", "phone"]);
    expect(options.fields).toContain("photos");
    expect(options.fields).toContain("services");
    expect(options.categories.find((c) => c.slug === "interior")?.name).toBe("Interior Designers");
  });
});
