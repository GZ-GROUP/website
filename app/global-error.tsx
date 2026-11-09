"use client";

import "./globals.css";
import { Button } from "@/components/ui/button";

// Last resort, when the root layout itself fails. It replaces the whole document
// and runs outside i18n, so the message is written in both languages.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es" className="dark">
      <head>
        <title>GZ Group</title>
      </head>
      <body className="antialiased">
        <main className="mx-auto flex min-h-dvh max-w-reading flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-display tracking-display">Algo salió mal</h1>
          <p className="mt-6 text-base leading-7">No pudimos cargar esta página. Inténtalo de nuevo en unos minutos.</p>
          <p lang="en" className="mt-2 text-base leading-7 text-muted-foreground">
            Something went wrong and we couldn&apos;t load this page. Try again in a few minutes.
          </p>
          <div className="mt-10">
            <Button onClick={() => retry()}>Reintentar / Try again</Button>
          </div>
          {error.digest && <p className="mt-8 text-sm text-muted-foreground">Ref: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
