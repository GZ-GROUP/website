import { getTranslations } from "next-intl/server";
import { publishedForDiscovery } from "@/lib/articles/queries";
import { absoluteUrl } from "@/lib/seo/metadata";
import { site } from "@/lib/site";

// Per request: `next build` runs without a database.
export const dynamic = "force-dynamic";

const RECENT_ARTICLES = 30;

/** Titles and summaries are user text: keep them from breaking the Markdown list. */
const inline = (text: string) => text.replace(/[\r\n]+/g, " ").replace(/[[\]]/g, "");

// https://llmstxt.org — public pages only.
export async function GET() {
  const t = await getTranslations({ locale: "es", namespace: "Hero" });
  const articles = await publishedForDiscovery(RECENT_ARTICLES);

  const sections: [string, string, string][] = [
    ["Blog", "/blog", "Proyectos de software, investigaciones, tutoriales y opinión."],
    ["Nosotros", "/team", "Las personas con trabajo publicado en GZ Group."],
    ["Contáctanos", "/contact", "Formulario de contacto y preguntas frecuentes."],
    ["Política de privacidad", "/privacy", "Qué datos se guardan y cómo ejercer tus derechos."],
    ["Términos y condiciones", "/terms", "Reglas de uso del sitio."],
  ];

  const lines = [
    `# ${site.name}`,
    "",
    `> ${t("lead")}`,
    "",
    "El sitio está en español y en inglés (rutas bajo /en). Cada artículo se publica en un solo idioma.",
    "",
    "## Secciones",
    "",
    ...sections.map(([name, path, description]) => `- [${name}](${absoluteUrl(path)}): ${description}`),
    `- [Código en GitHub](${site.githubUrl}): Repositorios de la comunidad.`,
  ];

  if (articles.length > 0) {
    lines.push("", "## Artículos recientes", "");
    for (const article of articles) {
      const url = absoluteUrl(`/blog/${article.slug}`, article.language === "EN" ? "en" : "es");
      lines.push(`- [${inline(article.title)}](${url})${article.excerpt ? `: ${inline(article.excerpt)}` : ""}`);
    }
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
