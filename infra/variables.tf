variable "google_credentials_file" {
  description = "Path to the Google Cloud service account JSON key."
  type        = string
  default     = "../keys/googleServiceAccount.json"
}

variable "google_project_id" {
  description = "Optional Google Cloud project ID. If omitted, Terraform reads it from the service account JSON."
  type        = string
  default     = ""
}

variable "google_region" {
  description = "Default Google Cloud region."
  type        = string
  default     = "us-central1"
}

variable "backend_image" {
  description = "Container image URI for the Cloud Run backend (e.g. us-central1-docker.pkg.dev/PROJECT/retailcortex-backend/api:latest). Use the placeholder on first apply before an image is pushed."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "allowed_origins" {
  description = "CORS allowed origins for the backend API."
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "allow_unauthenticated" {
  description = "Allow public (unauthenticated) invocations of the Cloud Run service."
  type        = bool
  default     = true
}

variable "secret_values" {
  description = <<-EOT
    Initial secret values for Secret Manager. Keys:
      database_url, clerk_jwks_url, clerk_secret_key,
      elastic_cloud_id, elastic_api_key,
      dynatrace_url, dynatrace_token
    Values are written once on first apply and ignored on subsequent applies.
  EOT
  type        = map(string)
  sensitive   = true
  default     = {}
}
