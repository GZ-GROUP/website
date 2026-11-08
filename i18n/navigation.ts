import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link and next/navigation.
// Always import Link/redirect/usePathname/useRouter from here, not from Next.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
