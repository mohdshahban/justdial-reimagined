/**
 * Admin-only remote MCP. The caller's Supabase OAuth access token is used for
 * every database request, so existing RLS policies still apply. No service key.
 */
import { createClient } from "@supabase/supabase-js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

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

function makeServer(db: AdminDb, userId: string) {
  const server = new McpServer({ name: "justdial-admin", version: "1.0.0" });

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

  server.registerTool("create_business_draft", {
    description: "CREATE a new business as PENDING, never live. Ask the user to explicitly approve the exact business details before calling this tool. Do not invent addresses, contacts or other business facts.",
    inputSchema: {
      name: z.string().trim().min(2).max(150),
      category: z.string().trim().min(2).max(120),
      city: z.string().trim().min(2).max(120),
      area: z.string().trim().max(150).optional(),
      address: z.string().trim().max(500).optional(),
      description: z.string().trim().max(3000).optional(),
      phone: z.string().trim().max(25).optional(),
      website: z.string().url().max(500).optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  }, async (input) => {
    const { data, error } = await db.from("businesses").insert({
      ...input, owner_id: userId, status: "pending",
    }).select("id,name,city,status").single();
    if (error) return failure(error.message);
    console.info("[mcp] created pending business", data.id);
    return result({ created: true, business: data, next_step: "Review and approve this business in Admin → Businesses before publication." });
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
