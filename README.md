# GZ Group

Plataforma editorial cloud-native para publicar, descubrir y discutir proyectos
tecnológicos e investigaciones desarrolladas por la comunidad de GZ Group.

## Estado del proyecto

🚧 En construcción — Fase 0 (arquitectura y cimientos). Todavía no hay
autenticación, artículos ni funcionalidades de comunidad implementadas.

## Stack

- Next.js 16 (App Router) + TypeScript + React 19
- Tailwind CSS v4 + shadcn/ui
- Prisma 7 + PostgreSQL 17
- Docker (desarrollo) · GitHub Actions (CI) · Azure/AKS (planeado, Fase 6-7)

## Arquitectura

Monolito modular. Ver `docs/adr/` para decisiones arquitectónicas.

## Requisitos

- Node.js 24 (LTS)
- Docker + Docker Compose
- npm

## Instalación

\`\`\`bash
git clone <repo-url>
cd gz-group
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Roadmap

Ver la sección de roadmap en `docs/`.

## Contribución

Proyecto interno de GZ Group. Guía de contribución pendiente (Fase 1).

## Licencia

Por definir.