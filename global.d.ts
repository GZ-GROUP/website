import type { routing } from "@/i18n/routing";
import type messages from "./messages/es.json";

// Type-safe locales and message keys for next-intl.
// Spanish is the reference catalog; tests/i18n/messages.test.ts keeps `en` in parity.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
