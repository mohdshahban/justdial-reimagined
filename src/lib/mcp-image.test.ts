import { describe, expect, it } from "vitest";
import { decodeMcpImage, MCP_IMAGE_LIMIT } from "./mcp-image";

describe("MCP image safety", () => {
  it("accepts a real PNG signature", () => {
    const png = btoa(String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10, 0, 0));
    expect(decodeMcpImage(png, "image/png").length).toBe(10);
  });

  it("rejects incorrect MIME, data URIs and invalid bytes", () => {
    const png = btoa(String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10));
    expect(() => decodeMcpImage(png, "image/jpeg")).toThrow(/content/);
    expect(() => decodeMcpImage(`data:image/png;base64,${png}`, "image/png")).toThrow(/raw base64/);
    expect(() => decodeMcpImage("@@@", "image/png")).toThrow();
  });

  it("rejects oversized images before decoding", () => {
    expect(() =>
      decodeMcpImage("A".repeat(Math.ceil((MCP_IMAGE_LIMIT * 4) / 3) + 5), "image/png"),
    ).toThrow(/limit/);
  });
});
