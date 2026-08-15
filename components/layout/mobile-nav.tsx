"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GZLogo } from "@/components/brand/logo";

const LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/equipo", label: "Equipo" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            nativeButton={true}
            aria-label="Abrir menú"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
        <SheetContent side="right" className="flex flex-col gap-6 border-border bg-background p-6">
          <GZLogo className="text-xl" />
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2 text-base font-medium text-foreground hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-6">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" onClick={() => setOpen(false)} />}
            >
              Ingresar
            </Button>
            <Button nativeButton={false} render={<Link href="/registro" onClick={() => setOpen(false)} />}>
              Registrarse
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}