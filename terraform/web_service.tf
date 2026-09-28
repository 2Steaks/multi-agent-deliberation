resource "render_web_service" "backend" {
  name   = "multi-agent-deliberation-api"
  plan   = var.backend_plan
  region = var.region

  runtime_source = {
    native_runtime = {
      auto_deploy   = true
      branch        = var.branch
      repo_url      = var.repo_url
      runtime       = "node"
      build_command = "npm ci && npm run build"
    }
  }

  start_command = "npm run start"

  env_vars = {
    MODEL             = { value = var.model }
    ANTHROPIC_API_KEY = { value = var.anthropic_api_key }
  }
}
