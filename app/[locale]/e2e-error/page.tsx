import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// Lets the e2e suite exercise the error screen in a production build.
// Without E2E_ERROR_ROUTE (only set by playwright.config.ts) it does not exist.
export default function E2EErrorPage() {
  if (process.env.E2E_ERROR_ROUTE !== "1") notFound();
  throw new Error("Deliberate failure for the e2e suite");
}
