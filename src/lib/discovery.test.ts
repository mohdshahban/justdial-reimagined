import { describe, expect, it } from "vitest";
import { directionsUrl, distanceKm, mobileDigits, openNow, parseCoordinates, phoneHref, slugify, whatsappUrl } from "./discovery";

describe("public business discovery", () => {
  it("keeps unknown opening hours unknown", () => {
    expect(openNow("", ["Mon"])).toBeNull();
    expect(openNow("10-8", ["Mon"])).toBeNull();
  });

  it("uses actual Indian opening hours and weekdays", () => {
    const sunday = new Date("2026-11-15T06:00:00.000Z"); // 11:30 am IST
    expect(openNow("10:00 am – 8:00 pm", ["Sun"], sunday)).toBe(true);
    expect(openNow("10:00 am – 8:00 pm", ["Mon"], sunday)).toBe(false);
    expect(openNow("24 Hrs", ["Sun"], sunday)).toBe(true);
  });

  it("does not invent map coordinates or distances", () => {
    expect(parseCoordinates({})).toBeUndefined();
    expect(parseCoordinates({ lat: 0, lng: 0 })).toBeUndefined();
    expect(parseCoordinates({ lat: 28.57, lng: 77.33 })).toEqual({ lat: 28.57, lng: 77.33 });
    expect(distanceKm({ lat: 28.57, lng: 77.33 }, { lat: 28.57, lng: 77.33 })).toBe(0);
    expect(slugify("Sector 22, Noida")).toBe("sector-22-noida");
  });

  it("shows links only for valid contact details", () => {
    expect(phoneHref("")).toBeUndefined();
    expect(phoneHref("0120-4312345")).toBe("tel:01204312345");
    expect(mobileDigits("+91 9876543210")).toBe("9876543210");
    expect(whatsappUrl("9876543210")).toBe("https://wa.me/919876543210");
    expect(whatsappUrl("0120-4312345")).toBeUndefined();
    expect(directionsUrl("Sector 22, Noida")).toContain("Sector%2022%2C%20Noida");
  });
});
