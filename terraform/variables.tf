variable "repo_url" {
  description = "Git repository Render builds both services from"
  type        = string
  default     = "https://github.com/2Steaks/multi-agent-deliberation"
}

variable "branch" {
  description = "Branch Render deploys from"
  type        = string
  default     = "main"
}

variable "region" {
  description = "Render region for both services"
  type        = string
  default     = "oregon"
}

variable "backend_plan" {
  description = "Render plan for the Mastra backend web service"
  type        = string
  default     = "free"
}

variable "model" {
  description = "Model identifier passed to the Mastra backend"
  type        = string
  default     = "anthropic/claude-haiku-4-5"
}

variable "anthropic_api_key" {
  description = "Anthropic API key for the Mastra backend"
  type        = string
  sensitive   = true
}
