import { createFileRoute } from "@tanstack/react-router";
import { mcpResourceMetadata } from "@/lib/mcp-resource";

export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
  server: { handlers: { GET: ({ request }) => mcpResourceMetadata(request) } },
});
