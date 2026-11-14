import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ClipboardCopy, ExternalLink, LockKeyhole, PlugZap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/mcp")({
  head: () => ({ meta: [{ title: "MCP Connector — Justdial Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const tools = [
  { name: "get_admin_overview", description: "Live counts of listings, leads, users and offerings" },
  { name: "list_businesses", description: "Find and inspect current business listings" },
  { name: "list_business_offerings", description: "Inspect products and services by business" },
  { name: "get_listing_form_options", description: "Read all business form fields, category slugs and choices" },
  { name: "get_business_details", description: "Read the full saved profile before editing" },
  { name: "create_business_draft", description: "Create a pending listing with all form fields" },
  { name: "update_business_listing", description: "Edit approved or pending listing fields with your approval" },
  { name: "upload_business_image", description: "Attach a cover, gallery photo or logo from JPG/PNG/WebP bytes" },
  { name: "create_business_offering_draft", description: "Create an unpublished product or service" },
];

function Page() {
  const [copied, setCopied] = useState(false);
  const endpoint = typeof window === "undefined" ? "/api/mcp" : `${window.location.origin}/api/mcp`;
  const copy = async () => {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return <div className="max-w-4xl space-y-6">
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><PlugZap className="size-4" /> Integrations</div>
      <h1 className="font-display text-3xl font-extrabold">MCP Connector</h1>
      <p className="mt-2 text-sm text-muted-foreground">Give an authorized AI assistant access to live directory data, complete every listing form field, upload images and prepare business drafts for review.</p>
    </div>

    <section className="rounded-3xl border bg-card p-5 sm:p-7">
      <h2 className="text-lg font-bold">Remote MCP endpoint</h2>
      <p className="mt-1 text-sm text-muted-foreground">Streamable HTTP · Supabase OAuth 2.1 · admin-only</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-muted p-3">
        <code className="min-w-0 flex-1 break-all text-xs sm:text-sm">{endpoint}</code>
        <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white" aria-label="Copy MCP endpoint">{copied ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}{copied ? "Copied" : "Copy"}</button>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" />
        <p>Only signed-in users with your database <strong>admin</strong> role can use these tools. Business creation stays <strong>pending</strong>; offerings stay <strong>unpublished</strong>. Editing an approved listing changes its public details immediately, so approve its exact content before using write tools. No delete or approval tools are exposed.</p>
      </div>
    </section>

    <section className="rounded-3xl border bg-card p-5 sm:p-7">
      <h2 className="text-lg font-bold">One-time Supabase setup</h2>
      <ol className="mt-4 list-inside list-decimal space-y-3 text-sm leading-relaxed">
        <li>Open <a className="font-semibold text-primary underline" href="https://supabase.com/dashboard/project/bejpxeesfllssivspgpe/auth/oauth-server" target="_blank" rel="noreferrer">Supabase → Authentication → OAuth Server <ExternalLink className="inline size-3" /></a> and enable the OAuth 2.1 server.</li>
        <li>Set <strong>Authorization Path</strong> to <code className="rounded bg-muted px-2 py-1">/oauth/consent</code>. Confirm the Auth Site URL is <code className="break-all rounded bg-muted px-2 py-1">https://justdial-reimagined.vercel.app</code>.</li>
        <li>Enable <strong>Dynamic Client Registration</strong> for compatible AI clients, or register a client manually with its callback URL.</li>
        <li>In your MCP client, add the endpoint above with <strong>OAuth</strong> authentication. Sign in with the admin account and approve the permission screen.</li>
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">Note: third-party MCP app support, especially write actions, depends on your ChatGPT plan and client. This page does not connect ChatGPT by itself.</p>
    </section>

    <section className="rounded-3xl border bg-card p-5 sm:p-7">
      <h2 className="text-lg font-bold">Available tools</h2>
      <p className="mt-2 text-sm text-muted-foreground">For a full profile, call <code>get_listing_form_options</code>, then create or update the listing. Upload images up to 3 MB as base64 JPG, PNG or WebP using <code>upload_business_image</code>; the tool attaches them to the listing automatically. Contact details, prices and images must come from verified sources.</p>
      <div className="mt-3 divide-y">
        {tools.map(tool => <div key={tool.name} className="py-3"><code className="text-sm font-semibold text-foreground">{tool.name}</code><p className="mt-1 text-sm text-muted-foreground">{tool.description}</p></div>)}
      </div>
    </section>
  </div>;
}
