terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

locals {
  service_account = try(jsondecode(file(var.google_credentials_file)), null)
  project_id      = var.google_project_id != "" ? var.google_project_id : try(local.service_account.project_id, null)
}

provider "google" {
  credentials = file(var.google_credentials_file)
  project     = local.project_id
  region      = var.google_region
}

# ── Modules ───────────────────────────────────────────────────────────────────

module "vertex_ai" {
  source     = "./modules/vertex_ai"
  project_id = local.project_id
  region     = var.google_region
}

module "cloud_run" {
  source                = "./modules/cloud_run"
  project_id            = local.project_id
  region                = var.google_region
  image                 = var.backend_image
  secret_ids            = module.secret_manager.secret_ids
  allowed_origins       = var.allowed_origins
  allow_unauthenticated = var.allow_unauthenticated
}

module "secret_manager" {
  source            = "./modules/secret_manager"
  project_id        = local.project_id
  accessor_sa_email = module.cloud_run.service_account_email
  secret_values     = var.secret_values
}
