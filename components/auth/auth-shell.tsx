import Image, { type StaticImageData } from "next/image";
import { GZLogo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";

type AuthShellProps = {
  title: string;
  lead?: string;
  /** Replaces the brand mark in the side panel. */
  illustration?: StaticImageData;
  children: React.ReactNode;
};

// Auth pages: the form on the left, the brand mark filling the other half on
// desktop so the screen is never a lone narrow column in a dark void.
export function AuthShell({ title, lead, illustration, children }: AuthShellProps) {
  return (
    <SiteShell mainClassName="py-16 md:py-24">
      <Container size="wide" className="grid items-stretch gap-16 lg:grid-cols-[minmax(0,28rem)_1fr]">
        <div className="w-full max-w-form">
          <h1 className="text-2xl font-bold leading-display tracking-display text-balance md:text-3xl">{title}</h1>
          {lead && <p className="mt-4 text-base leading-7 text-muted-foreground">{lead}</p>}
          <div className="mt-10">{children}</div>
        </div>
        <div aria-hidden className="hidden min-h-96 items-center justify-center bg-card lg:flex">
          {illustration ? (
            <Image src={illustration} alt="" sizes="320px" loading="eager" className="h-auto w-80" />
          ) : (
            <GZLogo className="h-56" />
          )}
        </div>
      </Container>
    </SiteShell>
  );
}
