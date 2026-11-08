import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import es from "@/messages/es.json";
import en from "@/messages/en.json";

type Catalog = { [key: string]: string | Catalog };

/** Flattens a catalog into dot paths: { a: { b: "x" } } → ["a.b"]. */
function keys(catalog: Catalog, prefix = ""): string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : keys(value, path);
  });
}

/** ICU placeholders in a message: "Hi {name}" → ["name"]. */
function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();
}

function get(catalog: Catalog, path: string): string {
  return path.split(".").reduce<string | Catalog>((node, key) => (node as Catalog)[key], catalog) as string;
}

const catalogs: Record<string, Catalog> = { es, en };

describe("i18n message catalogs", () => {
  it("has a catalog for every configured locale", () => {
    expect(Object.keys(catalogs).sort()).toEqual([...routing.locales].sort());
  });

  it("en has exactly the same keys as es (the reference catalog)", () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });

  it("uses the same ICU placeholders in every locale", () => {
    for (const path of keys(es)) {
      expect(placeholders(get(en, path)), path).toEqual(placeholders(get(es, path)));
    }
  });

  it("has no empty messages", () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      for (const path of keys(catalog)) {
        expect(get(catalog, path).trim(), `${locale}:${path}`).not.toBe("");
      }
    }
  });
});
