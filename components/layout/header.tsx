import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GZLogo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Code2, FlaskConical, Microscope, ArrowUpRight } from "lucide-react";

const PROJECT_CATEGORIES = [
  {
    icon: Code2,
    title: "Software",
    description: "Apps, herramientas y librerías construidas por la comunidad.",
    href: "/proyectos?categoria=software",
    tags: ["Web", "Mobile", "Backend"],
  },
  {
    icon: Microscope,
    title: "Investigación",
    description: "Papers y hallazgos técnicos de nuestros integrantes.",
    href: "/proyectos?categoria=investigacion",
    tags: ["Papers", "Datasets"],
  },
  {
    icon: FlaskConical,
    title: "Experimentos",
    description: "Prototipos todavía en fase temprana.",
    href: "/proyectos?categoria=experimentos",
    tags: ["Beta", "WIP"],
  },
] as const;

export function Header() {
  return (
    <div className="relative w-full  bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <GZLogo className="text-xl" />
            <span className="text-lg font-bold tracking-tight lg:hidden">
              GZ Group
            </span>
          </Link>

          <div className="hidden lg:block">
            <NavigationMenu
              className={cn(
                "static",
                "[&>.absolute]:inset-x-0 [&>.absolute]:top-full [&>.absolute]:w-full",
                "[&_[data-slot=navigation-menu-viewport]]:mt-1 [&_[data-slot=navigation-menu-viewport]]:!w-full",
                "[&_[data-slot=navigation-menu-viewport]]:rounded-none [&_[data-slot=navigation-menu-viewport]]:shadow-none [&_[data-slot=navigation-menu-viewport]]:ring-0",
                "[&_[data-slot=navigation-menu-viewport]]:border-0 [&_[data-slot=navigation-menu-viewport]]:border-b",
                "[&_[data-slot=navigation-menu-viewport]]:border-border",
                "[&_[data-slot=navigation-menu-viewport]]:bg-background",
                "[&_[data-slot=navigation-menu-viewport]]:transition-all [&_[data-slot=navigation-menu-viewport]]:duration-300 [&_[data-slot=navigation-menu-viewport]]:ease-in-out",
                "[&_[data-slot=navigation-menu-viewport]]:data-open:fade-in-0 [&_[data-slot=navigation-menu-viewport]]:data-closed:fade-out-0",
                "[&_[data-slot=navigation-menu-viewport]]:data-open:zoom-in-100 [&_[data-slot=navigation-menu-viewport]]:data-closed:zoom-out-100",
              )}
            >
              <NavigationMenuList className="gap-6">
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={<Link href="/blog" />}
                    className="rounded-xl bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Blog
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem className="gap-5">
                  <NavigationMenuTrigger className="h-auto rounded-xl bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[active]:bg-muted data-[state=open]:bg-muted">
                    Proyectos
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!w-full">
                    <div className="mx-auto grid max-w-6xl grid-cols-4 gap-6 divide-x divide-border px-6 py-8">
                      {PROJECT_CATEGORIES.map((cat) => (
                        <div key={cat.title} className="flex flex-col px-2 first:pl-0">
                          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                            <cat.icon className="h-5 w-5 text-foreground" />
                          </div>
                          <h4 className="mb-1 text-sm font-medium text-foreground">
                            <Link href={cat.href} className="hover:text-primary">
                              {cat.title}
                            </Link>
                          </h4>
                          <p className="mb-3 text-sm tracking-tight text-muted-foreground">
                            {cat.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cat.tags.map((tag) => (
                              <span
                                key={tag}
                                className="h-7 rounded-full border border-border px-3 text-xs leading-7 text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-col px-2">
                        <h4 className="mb-4 text-xs uppercase text-muted-foreground">
                          Destacado
                        </h4>
                        <Link
                          href="/blog?destacados=true"
                          className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-6 ring ring-primary/50 transition-all"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent group-hover:opacity-100" />
                          <div className="absolute inset-0 -z-10 bg-muted" />
                          <div>
                            <Badge variant="outline" className="mb-3">
                              Esta semana
                            </Badge>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">
                              Artículos más leídos
                            </h4>
                            <p className="text-sm tracking-tight text-muted-foreground">
                              Lo mejor publicado por la comunidad recientemente.
                            </p>
                          </div>
                          <div className="mt-4 flex items-center text-sm font-medium text-primary">
                            Ver más
                            <ArrowUpRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={<Link href="/equipo" />}
                    className="rounded-xl bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Equipo
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/login" />}
            className="rounded-xl"
          >
            Ingresar
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/registro" />}
            className="rounded-xl px-4 py-2"
          >
            Registrarse
          </Button>
        </div>

        <MobileNav />
      </div>
    </div>
  );
}