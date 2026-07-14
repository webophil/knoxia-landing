import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { translations } from "../js/translations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "src");
const outputDirectory = path.join(root, "dist");
const siteUrl = "https://knoxia.eu";

const pages = [
  {
    source: "index.html",
    routes: { fr: "/", en: "/en/", es: "/es/" }
  }
];

const locales = ["fr", "en", "es"];

function alternateLinks(routes, currentLocale) {
  const canonical = siteUrl + routes[currentLocale];
  const links = [`  <link rel="canonical" href="${canonical}" />`];
  for (const locale of locales) {
    links.push(`  <link rel="alternate" hreflang="${locale}" href="${siteUrl + routes[locale]}" />`);
  }
  links.push(`  <link rel="alternate" hreflang="x-default" href="${siteUrl + routes.fr}" />`);
  return links.join("\n");
}

function translate(html, locale, routes) {
  let localized = html.replace('<html lang="fr">', `<html lang="${locale}">`);
  const dictionary = translations[locale] || {};
  for (const [source, target] of Object.entries(dictionary).sort(([a], [b]) => b.length - a.length)) {
    localized = localized.replaceAll(source, target);
  }
  localized = localized.replace("<!-- SEO_ALTERNATES -->", alternateLinks(routes, locale));
  localized = localized.replace(/(<a data-locale="(fr|en|es)"[^>]*)(>)/g, (match, attributes, linkLocale, end) => {
    return linkLocale === locale ? `${attributes} aria-current="page"${end}` : `${attributes}${end}`;
  });
  return localized;
}

async function writePage(page, locale) {
  const template = await readFile(path.join(sourceDirectory, page.source), "utf8");
  const route = page.routes[locale];
  const relativeDirectory = route === "/" ? "" : route.slice(1);
  const target = path.join(outputDirectory, relativeDirectory, "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, translate(template, locale, page.routes));
}

function sitemap() {
  const entries = [];
  for (const page of pages) {
    for (const locale of locales) {
      const links = locales.map((alternativeLocale) => `    <xhtml:link rel="alternate" hreflang="${alternativeLocale}" href="${siteUrl + page.routes[alternativeLocale]}" />`).join("\n");
      entries.push(`  <url>\n    <loc>${siteUrl + page.routes[locale]}</loc>\n${links}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl + page.routes.fr}" />\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  cp(path.join(root, "assets"), path.join(outputDirectory, "assets"), { recursive: true }),
  cp(path.join(root, "css"), path.join(outputDirectory, "css"), { recursive: true }),
  cp(path.join(root, "js"), path.join(outputDirectory, "js"), { recursive: true })
]);
for (const page of pages) {
  for (const locale of locales) await writePage(page, locale);
}
await writeFile(path.join(outputDirectory, "sitemap.xml"), sitemap());
await writeFile(path.join(outputDirectory, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://knoxia.eu/sitemap.xml\n");
