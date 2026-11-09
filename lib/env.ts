import { z } from "zod";

// Server-only environment, validated lazily (at first use, not at import) so
// `next build` can run without runtime secrets. Empty strings count as unset.

const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());
const flag = z.preprocess((v) => (v === "" ? undefined : v), z.enum(["true", "false"]).optional()).transform(
  (v) => v === "true",
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BETTER_AUTH_URL: z.url(),

  // Email (self-hosted SMTP). EMAIL_TRANSPORT overrides the automatic choice.
  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: flag,
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  EMAIL_FROM: optional,
  EMAIL_TRANSPORT: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["smtp", "console", "file"]).optional()),

  // Master admin bootstrap (ADR 0005)
  ADMIN_EMAIL: z.preprocess((v) => (v === "" ? undefined : v), z.email().default("admin@gzgroup.dev")),
  ADMIN_INITIAL_PASSWORD: optional,

  // Object storage (S3-compatible; RustFS locally — ADR 0008)
  S3_ENDPOINT: optional,
  S3_REGION: z.preprocess((v) => (v === "" ? undefined : v), z.string().default("us-east-1")),
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  S3_BUCKET: z.preprocess((v) => (v === "" ? undefined : v), z.string().default("gz-media")),
  S3_FORCE_PATH_STYLE: z
    .preprocess((v) => (v === "" ? undefined : v), z.enum(["true", "false"]).default("true"))
    .transform((v) => v === "true"),

  // Contact published in the privacy policy (Decreto Ejecutivo 285, art. 14)
  LEGAL_CONTACT_EMAIL: optional,

  // OAuth (optional: a provider is enabled only when both values exist)
  GITHUB_CLIENT_ID: optional,
  GITHUB_CLIENT_SECRET: optional,
  LINKEDIN_CLIENT_ID: optional,
  LINKEDIN_CLIENT_SECRET: optional,
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server environment: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
