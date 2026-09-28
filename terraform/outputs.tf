output "backend_url" {
  description = "URL of the Mastra backend web service"
  value       = render_web_service.backend.url
}

output "web_url" {
  description = "URL of the static web UI"
  value       = render_static_site.web.url
}
