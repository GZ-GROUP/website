import { defineConfig, devices } from "@playwright/test";

// End-to-end suite: a production build (`next build && next start`) against a
// dedicated database that is reset on every run. Never points at the dev DB.
const PORT = Number(process.env.E2E_PORT ?? 3200);
const baseURL = `http://localhost:${PORT}`;

export const E2E_ADMIN = {
  email: "admin@gzgroup.dev",
  initialPassword: "e2e-initial-master-password",
} as const;

const env = {
  DATABASE_URL:
    process.env.E2E_DATABASE_URL ?? "postgresql://gz_user:gz_password@localhost:5432/gz_group_e2e?schema=public",
  BETTER_AUTH_URL: baseURL,
  BETTER_AUTH_SECRET: "e2e-only-secret-not-used-anywhere-else-0123456789",
  NEXT_PUBLIC_APP_URL: baseURL,
  EMAIL_TRANSPORT: "file",
  AUTH_RATE_LIMIT: "off",
  ADMIN_EMAIL: E2E_ADMIN.email,
  ADMIN_INITIAL_PASSWORD: E2E_ADMIN.initialPassword,
  GITHUB_CLIENT_ID: "",
  GITHUB_CLIENT_SECRET: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: ".e2e/results",
  // One shared database and mailbox: run serially.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL,
    locale: "es-ES",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Reset the e2e database and mailbox, build, then start (the master admin is
    // bootstrapped by instrumentation.ts when the server starts).
    command: `rm -rf .e2e/mailbox && npx prisma migrate reset --force && npx next build && npx next start -p ${PORT}`,
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 600_000,
    env,
    stdout: "pipe",
  },
});
