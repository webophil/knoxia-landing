import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { translations, localizedAssets } from "../js/translations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "src");
const outputDirectory = path.join(root, "dist");
const siteUrl = "https://knoxia.eu";

const pages = [
  {
    source: "index.html",
    routes: { fr: "/", en: "/en/", es: "/es/" }
  },
  {
    source: "legal-notice.html",
    routes: { fr: "/mentions-legales/", en: "/en/legal-notice/", es: "/es/aviso-legal/" }
  },
  {
    source: "privacy-policy.html",
    routes: { fr: "/politique-confidentialite/", en: "/en/privacy-policy/", es: "/es/politica-de-privacidad/" }
  },
  {
    source: "contact.html",
    routes: { fr: "/contact/", en: "/en/contact/", es: "/es/contacto/" }
  },
  {
    source: "security-white-paper.html",
    routes: { fr: "/livre-blanc-securite/", en: "/en/security-white-paper/", es: "/es/libro-blanco-seguridad/" }
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

const routesBySource = Object.fromEntries(pages.map((page) => [page.source, page.routes]));

function localizedPageLinks(html, locale) {
  const links = {
    "__HOME_URL__": routesBySource["index.html"][locale],
    "__LEGAL_NOTICE_URL__": routesBySource["legal-notice.html"][locale],
    "__PRIVACY_POLICY_URL__": routesBySource["privacy-policy.html"][locale],
    "__CONTACT_URL__": routesBySource["contact.html"][locale],
    "__WHITE_PAPER_URL__": routesBySource["security-white-paper.html"][locale]
  };
  for (const page of pages) {
    const pageKey = page.source === "legal-notice.html" ? "LEGAL_NOTICE" : page.source === "privacy-policy.html" ? "PRIVACY_POLICY" : page.source === "contact.html" ? "CONTACT" : page.source === "security-white-paper.html" ? "WHITE_PAPER" : "HOME";
    for (const language of locales) links[`__${pageKey}_${language.toUpperCase()}_URL__`] = page.routes[language];
  }
  for (const [placeholder, url] of Object.entries(links)) html = html.replaceAll(placeholder, url);
  return html;
}

function translate(html, locale, routes) {
  let localized = localizedPageLinks(html.replace('<html lang="fr">', `<html lang="${locale}">`), locale);
  const dictionary = translations[locale] || {};
  for (const [source, target] of Object.entries(dictionary).sort(([a], [b]) => b.length - a.length)) {
    localized = localized.replaceAll(source, target);
  }
  const assets = localizedAssets[locale] || localizedAssets.fr;
  localized = localized.replaceAll("__HERO_MOCK__", assets.heroMock);
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
function llms() {
  return `# KnoXia

> KnoXia is a privacy-first personal document vault for mobile devices. Documents are encrypted locally and remain under the user's control.

## Français

- [Accueil](https://knoxia.eu/)
- [Livre blanc sécurité](https://knoxia.eu/livre-blanc-securite/)
- [Politique de confidentialité](https://knoxia.eu/politique-confidentialite/)
- [Mentions légales](https://knoxia.eu/mentions-legales/)
- [Contact](https://knoxia.eu/contact/)

## English

- [Home](https://knoxia.eu/en/)
- [Security white paper](https://knoxia.eu/en/security-white-paper/)
- [Privacy policy](https://knoxia.eu/en/privacy-policy/)
- [Legal notice](https://knoxia.eu/en/legal-notice/)
- [Contact](https://knoxia.eu/en/contact/)

## Español

- [Inicio](https://knoxia.eu/es/)
- [Libro blanco de seguridad](https://knoxia.eu/es/libro-blanco-seguridad/)
- [Política de privacidad](https://knoxia.eu/es/politica-de-privacidad/)
- [Aviso legal](https://knoxia.eu/es/aviso-legal/)
- [Contacto](https://knoxia.eu/es/contacto/)

## Security summary

- Free mode uses local encryption and requires neither an account nor a server.
- A user-selected 8-to-16-character PIN participates in generating the encryption key through PBKDF2 with 600,000 iterations.
- Documents are encrypted locally with AES-256-GCM.
- Biometrics may be used as an alternative to the PIN when supported by the device.
- Premium backup and synchronisation transfer encrypted content. Vercel Blob does not receive the PIN, the Premium access key or readable documents.
- The Premium access key remains local and does not replace the PIN.

## Technical references

- [NIST FIPS 197 — AES](https://csrc.nist.gov/pubs/fips/197/final)
- [IETF RFC 8018 — PBKDF2](https://www.rfc-editor.org/rfc/rfc8018.html)
- [IETF RFC 8446 — TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)
`;
}

await writeFile(path.join(outputDirectory, "sitemap.xml"), sitemap());
await writeFile(path.join(outputDirectory, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://knoxia.eu/sitemap.xml\n");
await writeFile(path.join(outputDirectory, "llms.txt"), llms());
