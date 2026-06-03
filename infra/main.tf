terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

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

locals {
  service_account = try(jsondecode(file(var.google_credentials_file)), null)
  project_id      = var.google_project_id != "" ? var.google_project_id : try(local.service_account.project_id, null)
}

provider "google" {
  credentials = file(var.google_credentials_file)
  project     = local.project_id
  region      = var.google_region
}
