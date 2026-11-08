import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

// The locale comes from the root `[locale]` segment via next/root-params
// (Next 16), which keeps pages statically renderable without calling
// setRequestLocale in every route. Root params are not available inside
// Server Actions; only there do we fall back to next-intl's request locale.
//
// Note: `params.requestLocale` is a lazy getter that reads headers() — reading
// it (even by destructuring) would make every page dynamic. Touch it only in
// the fallback.
export default getRequestConfig(async (params) => {
  let requested: string | undefined = params.locale;
  if (!requested) {
    try {
      requested = await rootLocale();
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("Server Action"))) throw error;
      requested = await params.requestLocale;
    }
  }
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
