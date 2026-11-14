/** Keep MCP image payloads below Vercel's request-body limit after base64 encoding. */
export const MCP_IMAGE_LIMIT = 3 * 1024 * 1024;
export const MCP_IMAGE_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export type McpImageMime = keyof typeof MCP_IMAGE_MIME;

export function decodeMcpImage(base64: string, mime: McpImageMime): Uint8Array {
  if (base64.length > Math.ceil((MCP_IMAGE_LIMIT * 4) / 3) + 4)
    throw new Error("Image exceeds the 3 MB MCP upload limit");
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error("Image must be raw base64 (no data URI prefix)");
  }
  if (!binary || binary.length > MCP_IMAGE_LIMIT || btoa(binary) !== base64)
    throw new Error("Invalid image encoding or size");
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png =
    bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  const webp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(
    (mime === "image/jpeg" && jpeg) ||
    (mime === "image/png" && png) ||
    (mime === "image/webp" && webp)
  )) {
    throw new Error("Image content does not match JPG, PNG or WebP MIME type");
  }
  return bytes;
}
