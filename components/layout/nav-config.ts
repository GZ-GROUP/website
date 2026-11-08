import { Code2, FlaskConical, Microscope, type LucideIcon } from "lucide-react";
import type { ShowcaseCategorySlug } from "@/lib/content/types";

// Shared by the desktop header, the mobile menu, the footer and the landing.
// Labels live in messages/*.json; this file only holds routes and icons.

export const PRIMARY_NAV = [
  { key: "blog", href: "/blog" },
  { key: "projects", href: "/projects" },
  { key: "team", href: "/team" },
] as const;

export const SHOWCASE_CATEGORIES: ReadonlyArray<{
  slug: ShowcaseCategorySlug;
  icon: LucideIcon;
}> = [
  { slug: "software", icon: Code2 },
  { slug: "research", icon: Microscope },
  { slug: "experiments", icon: FlaskConical },
];

export function categoryHref(slug: ShowcaseCategorySlug) {
  return { pathname: "/projects", query: { category: slug } } as const;
}
