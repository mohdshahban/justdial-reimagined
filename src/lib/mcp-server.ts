/**
 * Admin-only remote MCP. The caller's Supabase OAuth access token is used for
 * every database request, so existing RLS policies still apply. No service key.
 */
import { createClient } from "@supabase/supabase-js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { businessDraftInput, businessUpdateInput, listingFormOptions, normalizeCategory, normalizeCity, validateSpeciality } from "./mcp-listing-fields";
import { decodeMcpImage, MCP_IMAGE_LIMIT, MCP_IMAGE_MIME } from "./mcp-image";

const BUSINESS_FIELDS = "id,name,category,sub,year_established,price,description,tags,city,area,address,landmark,pincode,phone,whatsapp,email,website,days_open,hours,payment_methods,services,photos,logo,status,created_at,updated_at";

const SUPABASE_URL = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
const SUPABASE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

function resourceMetadata(request: Request) {
  return `${new URL(request.url).origin}/.well-known/oauth-protected-resource`;
}

function unauthorized(request: Request, message = "An admin OAuth access token is required") {
  return Response.json({ error: "unauthorized", message }, {
    status: 401,
    headers: { "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata(request)}"`, "Cache-Control": "no-store" },
  });
}

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function failure(message: string) {
  return { isError: true as const, content: [{ type: "text" as const, text: message }] };
}

async function adminClient(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { error: Response.json({ error: "Supabase is not configured" }, { status: 503 }) };

  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return { error: unauthorized(request) };
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  const db = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) return { error: unauthorized(request, "Invalid or expired access token") };

  const { data: isAdmin, error: roleError } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (roleError) {
    console.error("[mcp] role check failed", roleError.code);
    return { error: Response.json({ error: "Permission check unavailable" }, { status: 503 }) };
  }
  if (!isAdmin) return { error: Response.json({ error: "Admin role required" }, { status: 403 }) };
  return { db, user };
}

type AdminDb = ReturnType<typeof createClient<Database>>;

async function verifyStoredImages(db: AdminDb, photos: string[] = [], logo?: string | null) {
  const paths = [...new Set([...photos, ...(logo ? [logo] : [])])];
  if (!paths.length) return null;
  const { data, error } = await db.storage.from("business-photos").createSignedUrls(paths, 60);
  if (error || data?.length !== paths.length || data.some(image => !image.signedUrl)) {
    return "One or more photo/logo paths do not exist or are not accessible. Upload the image first.";
  }
  return null;
}

function makeServer(db: AdminDb, userId: string) {
  const server = new McpServer({ name: "justdial-admin", version: "1.1.0" });

  server.registerTool("get_admin_overview", {
    description: "Read live database counts for approved/pending businesses, users, leads and products/services.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  }, async () => {
    const metrics = await Promise.all([
      db.from("businesses").select("id", { head: true, count: "exact" }).eq("status", "approved"),
      db.from("businesses").select("id", { head: true, count: "exact" }).eq("status", "pending"),
      db.from("profiles").select("id", { head: true, count: "exact" }),
      db.from("leads").select("id", { head: true, count: "exact" }),
      db.from("business_offerings").select("id", { head: true, count: "exact" }),
    ]);
    if (metrics.some((m) => m.error)) return failure("Failed to load some counts. Check the database schema and RLS policies.");
    return result(Object.fromEntries(["live_businesses", "pending_businesses", "users", "leads", "offerings"].map((k, i) => [k, metrics[i]?.count ?? 0])));
  });

  server.registerTool("list_businesses", {
    description: "List actual business records, including pending drafts, for directory administration.",
    inputSchema: { search: z.string().trim().max(100).optional(), status: z.enum(["all", "pending", "approved", "rejected"]).default("all"), limit: z.number().int().min(1).max(100).default(25) },
    annotations: { readOnlyHint: true },
  }, async ({ search, status, limit }) => {
    let query = db.from("businesses").select("id,name,category,city,area,status,phone,website,created_at").order("created_at", { ascending: false }).limit(limit);
    if (status !== "all") query = query.eq("status", status);
    if (search) query = query.ilike("name", `%${search.replace(/[%_]/g, "\\$&")}%`);
    const { data, error } = await query;
    return error ? failure(error.message) : result({ businesses: data ?? [] });
  });

  server.registerTool("list_business_offerings", {
    description: "List product and service records, including unpublished drafts.",
    inputSchema: { business_id: z.string().uuid().optional(), kind: z.enum(["all", "product", "service"]).default("all"), limit: z.number().int().min(1).max(100).default(25) },
    annotations: { readOnlyHint: true },
  }, async ({ business_id, kind, limit }) => {
    let query = db.from("business_offerings").select("id,business_id,kind,name,category,description,pricing,published,created_at").order("created_at", { ascending: false }).limit(limit);
    if (business_id) query = query.eq("business_id", business_id);
    if (kind !== "all") query = query.eq("kind", kind);
    const { data, error } = await query;
    return error ? failure(error.message) : result({ offerings: data ?? [] });
  });

  server.registerTool("get_listing_form_options", {
    description: "Read the exact admin business-form fields, category slugs, specialities, cities, days, payment methods and image limits. Call before creating or editing listings.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  }, async () => result(listingFormOptions()));

  server.registerTool("get_business_details", {
    description: "Read a business listing's complete editable fields, including saved services, photo paths and logo path, before making a partial update. Admin-only.",
    inputSchema: { business_id: z.string().uuid() },
    annotations: { readOnlyHint: true },
  }, async ({ business_id }) => {
    const { data, error } = await db.from("businesses").select(BUSINESS_FIELDS).eq("id", business_id).maybeSingle();
    if (error) return failure(error.message);
    return data ? result({ business: data }) : failure("Business not found");
  });

  server.registerTool("create_business_draft", {
    description: "CREATE a business as a PENDING draft, never live. Accepts all admin listing-form details: category, speciality, locality, contact, timings, services, highlights, photos and logo. Call get_listing_form_options first. Ask for explicit approval of the exact content; never invent business facts or prices. Incomplete drafts are allowed but cannot be published through this tool.",
    inputSchema: businessDraftInput,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  }, async (input) => {
    let category: string;
    let city: string;
    try {
      category = normalizeCategory(input.category);
      city = normalizeCity(input.city);
      validateSpeciality(category, input.sub ?? "");
    } catch (error) { return failure(error instanceof Error ? error.message : "Invalid listing options"); }
    const imageError = await verifyStoredImages(db, input.photos, input.logo);
    if (imageError) return failure(imageError);
    const { data, error } = await db.from("businesses").insert({
      ...input, category, city, owner_id: userId, status: "pending",
    }).select(BUSINESS_FIELDS).single();
    if (error) return failure(error.message);
    console.info("[mcp] created pending business", data.id);
    return result({ created: true, business: data, next_step: "Review and approve this business in Admin → Businesses before publication." });
  });

  server.registerTool("update_business_listing", {
    description: "UPDATE ONLY provided editable fields on an existing listing. The same fields as the admin creation form are supported, including saved photo paths, logo and services; arrays replace their complete old values. Never change status, owner, verification or paid flags. Approved listings change publicly immediately; get explicit user approval for the exact update before calling. Do not invent missing contact details.",
    inputSchema: businessUpdateInput,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  }, async ({ business_id, changes }) => {
    const { data: current, error: readError } = await db.from("businesses").select("id,name,category,sub,status").eq("id", business_id).maybeSingle();
    if (readError) return failure(readError.message);
    if (!current) return failure("Business not found");
    const patch = { ...changes };
    try {
      if (patch.category !== undefined) {
        patch.category = normalizeCategory(patch.category);
        // The browser form clears a speciality whenever category changes.
        if (patch.category !== current.category && patch.sub === undefined) patch.sub = "";
      }
      if (patch.city !== undefined) patch.city = normalizeCity(patch.city);
      validateSpeciality(patch.category ?? current.category, patch.sub ?? (patch.category === undefined ? current.sub : ""));
    } catch (error) { return failure(error instanceof Error ? error.message : "Invalid listing options"); }
    if (patch.photos !== undefined || patch.logo) {
      const imageError = await verifyStoredImages(db, patch.photos, patch.logo);
      if (imageError) return failure(imageError);
    }
    const { data, error } = await db.from("businesses").update(patch).eq("id", business_id).select(BUSINESS_FIELDS).single();
    if (error) return failure(error.message);
    console.info("[mcp] updated listing", business_id, Object.keys(patch));
    return result({ updated: true, changed_fields: Object.keys(patch), public_immediately: current.status === "approved", business: data });
  });

  server.registerTool("upload_business_image", {
    description: "UPLOAD and attach a user-authorized JPG/PNG/WebP image (max 3 MB due to MCP request-body limits) to an existing listing as cover photo, gallery photo or logo. Provide raw base64 bytes, not a URL. Requires explicit user approval of the image and listing; approved listings change publicly immediately. Storage stays private; no arbitrary external URL fetching.",
    inputSchema: {
      business_id: z.string().uuid(),
      kind: z.enum(["cover", "photo", "logo"]),
      mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
      image_base64: z.string().min(1).max(Math.ceil(MCP_IMAGE_LIMIT * 4 / 3) + 4),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  }, async ({ business_id, kind, mime_type, image_base64 }) => {
    const { data: current, error: readError } = await db.from("businesses").select("id,name,status,photos,logo").eq("id", business_id).maybeSingle();
    if (readError) return failure(readError.message);
    if (!current) return failure("Business not found");
    if (kind !== "logo" && current.photos.length >= 10) return failure("Business already has 10 photos. Choose an existing image to replace in the admin editor.");
    let bytes: Uint8Array;
    try { bytes = decodeMcpImage(image_base64, mime_type); } catch (error) { return failure(error instanceof Error ? error.message : "Invalid image"); }
    const path = `${userId}/${crypto.randomUUID()}.${MCP_IMAGE_MIME[mime_type]}`;
    const { error: uploadError } = await db.storage.from("business-photos").upload(path, bytes, { contentType: mime_type, upsert: false });
    if (uploadError) return failure(`Image upload failed: ${uploadError.message}`);
    const photos = kind === "cover" ? [path, ...current.photos] : [...current.photos, path];
    const patch = kind === "logo" ? { logo: path } : { photos };
    const { data, error } = await db.from("businesses").update(patch).eq("id", business_id).select("id,name,status,photos,logo").single();
    if (error) {
      await db.storage.from("business-photos").remove([path]);
      return failure(`Image uploaded but could not be attached: ${error.message}`);
    }
    console.info("[mcp] attached business image", business_id, kind);
    return result({ uploaded: true, kind, storage_path: path, business: data, public_immediately: current.status === "approved" });
  });

  server.registerTool("create_business_offering_draft", {
    description: "CREATE an unpublished product/service draft for an existing business. Ask the user to explicitly approve the details before calling this tool. Do not invent pricing or specifications.",
    inputSchema: {
      business_id: z.string().uuid(),
      kind: z.enum(["product", "service"]),
      name: z.string().trim().min(2).max(120),
      category: z.string().trim().max(120).default(""),
      description: z.string().trim().max(3000).default(""),
      price_inr: z.number().finite().min(0).max(1_000_000_000).optional(),
      unit: z.string().trim().max(40).default(""),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  }, async ({ business_id, kind, name, category, description, price_inr, unit }) => {
    const { data: business, error: businessError } = await db.from("businesses").select("id,name").eq("id", business_id).maybeSingle();
    if (businessError) return failure(businessError.message);
    if (!business) return failure("Business not found. Create the business draft first.");
    const pricing = price_inr === undefined
      ? { mode: "quote", price: 0, max: 0, discount: 0, unit: "", tiers: [] }
      : { mode: "single", price: price_inr, max: 0, discount: 0, unit, tiers: [] };
    const { data, error } = await db.from("business_offerings").insert({
      business_id, kind, name, category, description, pricing, published: false,
    }).select("id,business_id,kind,name,published").single();
    if (error) return failure(error.message);
    console.info("[mcp] created unpublished offering", data.id);
    return result({ created: true, offering: data, business_name: business.name, next_step: "Review the item in Admin → Products & services before publishing." });
  });

  return server;
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  try {
    const access = await adminClient(request);
    if (access.error) return access.error;
    const { db, user } = access;
    if (!db || !user) return unauthorized(request);

    if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
    if (!(request.headers.get("content-type") || "").includes("application/json")) return Response.json({ error: "Expected JSON" }, { status: 415 });

    // One transport per request: Vercel functions are stateless and concurrent.
    const server = makeServer(db, user.id);
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    console.error("[mcp] request failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "MCP request could not be completed" }, { status: 500 });
  }
}
