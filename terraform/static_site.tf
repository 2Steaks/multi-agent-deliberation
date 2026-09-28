resource "render_static_site" "web" {
  name          = "multi-agent-deliberation-ui"
  repo_url      = var.repo_url
  branch        = var.branch
  build_command = "npm ci && npm run build:ui"
  publish_path  = "dist-web"
  auto_deploy   = true

  # Must match the env var name src/web/lib/mastra-client.ts actually reads
  # (import.meta.env.VITE_MASTRA_API_URL), or the built UI silently falls
  # back to http://localhost:4111 in production.
  env_vars = {
    VITE_MASTRA_API_URL = { value = render_web_service.backend.url }
  }
}
