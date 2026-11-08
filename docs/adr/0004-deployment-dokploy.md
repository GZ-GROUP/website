# ADR 0004 — Deploy on Dokploy instead of Azure/AKS

- **Status:** Accepted (implementation in Phase 2)
- **Date:** 2026-11-08
- **Supersedes:** the Azure Container Registry + AKS + Terraform plan

## Context

The original plan targeted Azure Kubernetes Service. For a student team with one application and one database, Kubernetes adds cost and operational work without a matching benefit. Dokploy is a self-hosted PaaS (Docker + Traefik) that runs on a single VPS.

## Decision

- **App:** a Dokploy application built from the repository's production `Dockerfile` (standalone Next.js, non-root, `HOSTNAME=0.0.0.0`, port 3000). A later option is to build the image in GitHub Actions, push it to GHCR, and have Dokploy pull a tagged image.
- **Database:** a Dokploy-managed PostgreSQL 17 service on the internal network, with scheduled backups to S3-compatible storage. Restores are tested before launch.
- **Secrets:** set in Dokploy's environment settings. Never in Git or baked into the image.
- **TLS and domain:** Traefik with Let's Encrypt, managed by Dokploy.
- **Migrations:** `prisma migrate deploy` runs once per deploy before the new container serves traffic. With a single replica, a pre-start step is acceptable. With several replicas it becomes a separate one-off job.
- **Health:** `/api/health` (Phase 2) backs the container `HEALTHCHECK` and Dokploy's zero-downtime swap.

## Consequences

- No Kubernetes manifests and no Terraform. Rebuilding the server is documented as a runbook in Phase 2.
- Single-host risk: mitigated by off-host database backups, and revisited if uptime requirements grow.
