import Link from "next/link";
import { GitBranch, Globe, X } from "lucide-react";
import { GZLogo } from "@/components/brand/logo";

const SOCIAL_LINKS = [
  { icon: <GitBranch className="size-4" />, href: "https://github.com" },
  { icon: <Globe className="size-4" />, href: "https://linkedin.com" },
  { icon: <X className="size-4" />, href: "https://twitter.com" },
] as const;

const LINK_GROUPS = [
  {
    title: "Explorar",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Proyectos", href: "/proyectos" },
      { label: "Equipo", href: "/equipo" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { label: "Unirme", href: "/registro" },
      { label: "Iniciar sesión", href: "/login" },
      { label: "GitHub", href: "https://github.com" },
    ],
  },
] as const;

const LEGAL_LINKS = [
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
] as const;

export function Footer() {
  return (
    <footer className=" bg-background/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <GZLogo className="text-2xl" />
              <span className="text-lg font-semibold tracking-tight">GZ Group</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Comunidad estudiantil de desarrollo de software: publicamos, descubrimos y
              discutimos proyectos, investigaciones y experimentos tecnológicos.
            </p>
          </div>

          <div className="flex flex-wrap gap-10">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
                aria-label={social.href}
              >
                {social.icon}
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <p>© {new Date().getFullYear()} GZ Group. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              {LEGAL_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
