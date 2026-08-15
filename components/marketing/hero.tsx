import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-x-[-18%] bottom-[-34%] h-[78%] rounded-[100%] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in oklab, var(--color-primary-500) 58%, transparent) 0%, color-mix(in oklab, var(--color-secondary-500) 34%, transparent) 34%, color-mix(in oklab, var(--color-secondary-600) 20%, transparent) 58%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[68%]"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--color-secondary-600) 42%, transparent), color-mix(in oklab, var(--color-primary-500) 20%, transparent) 42%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--background) 18%, transparent) 0%, transparent 34%, color-mix(in oklab, var(--background) 90%, transparent) 78%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--background) 0%, color-mix(in oklab, var(--background) 68%, transparent) 38%, color-mix(in oklab, var(--background) 12%, transparent) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="rounded-full border border-border bg-background/50 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-md">
          Comunidad tecnológica estudiantil
        </div>

        <h1 className="mt-8 max-w-5xl text-balance text-5xl font-medium leading-[0.96] tracking-normal md:text-6xl lg:text-7xl">
          Donde los proyectos de la comunidad GZ Group toman visibilidad
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
          Publica, descubre y discute proyectos universitarios, investigaciones y
          experimentos de software creados por estudiantes apasionados por el desarrollo.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/blog" />}
            className="h-11 w-44 rounded-lg shadow-[0_1px_0_rgba(255,255,255,0.24)_inset,0_18px_60px_rgba(0,0,0,0.12)]"
          >
            Explorar el blog
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/registro" />}
            className="h-11 w-44 rounded-lg bg-background/45 backdrop-blur"
          >
            Unirme a GZ Group
          </Button>
        </div>
      </div>
    </section>
  );
}