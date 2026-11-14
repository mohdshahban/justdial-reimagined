export function mcpResourceMetadata(request: Request) {
  const origin = new URL(request.url).origin;
  return Response.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: ["https://bejpxeesfllssivspgpe.supabase.co/auth/v1"],
    bearer_methods_supported: ["header"],
    scopes_supported: ["openid", "email", "profile"],
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
