resource "render_static_site" "web" {
  name          = "multi-agent-deliberation-ui"
  repo_url      = var.repo_url
  branch        = var.branch
  build_command = "npm ci && npm run build:ui"
  publish_path  = "dist-web"
  auto_deploy   = true

  # Wired for when the UI moves off mock data (src/web/lib/mock-data.ts)
  # onto real calls to the backend service.
  env_vars = {
    VITE_API_URL = { value = render_web_service.backend.url }
  }
}
