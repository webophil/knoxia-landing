# KnoXia landing — routes localisées

Le site est généré statiquement depuis une seule source française.

- Contenu de l’accueil : `src/index.html`
- Catalogue de traductions : `js/translations.js`
- Générateur et liste des pages : `scripts/build.mjs`

`npm run build` produit :

- `/` (français par défaut)
- `/en/`
- `/es/`
- `/sitemap.xml` et `/robots.txt`

Pour ajouter une page, créez son modèle français dans `src/`, ajoutez ses routes dans `pages` dans `scripts/build.mjs`, puis complétez uniquement les traductions nécessaires dans le catalogue. Les pages générées reçoivent automatiquement les balises canonical et hreflang.
