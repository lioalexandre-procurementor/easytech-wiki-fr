# EasyTech Wiki FR

Wiki francophone des jeux EasyTech (World Conqueror 4, European War 6/7, Great Conqueror Rome).
Stack : Next.js 14 (App Router) + TypeScript + Tailwind CSS, génération statique (SSG), data en JSON file-based.

## État du contenu WC4

La mise à jour de septembre 2026 distingue les fiches détaillées et les références dont les statistiques restent à vérifier. Les versions mobiles suivies sont centralisées dans `data/wc4/release-status.json`.

Voir `docs/WC4-CONTENT-STATUS.md` pour les changements et les preuves encore nécessaires, et `CONTENT-WORKFLOW.md` pour le processus de vérification. Les anciens exemples de structure ci-dessous ne constituent pas un inventaire à jour.

## Démarrage local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # vérifier la prod
```

## Structure

```
app/                          # App Router pages
  page.tsx                    # Home (liste des jeux)
  world-conqueror-4/
    page.tsx                  # Hub WC4
    unites-elite/
      page.tsx                # Liste des 38 unités
      [slug]/page.tsx         # Fiche unité (généré statiquement)
components/                   # React components (TopBar, UnitCard, UnitDetailClient...)
data/wc4/elite-units/         # 38 JSON files + _index.json
lib/
  types.ts                    # TypeScript types (UnitData, Tier, Category...)
  units.ts                    # Loader filesystem + helpers
  games.ts                    # Catalogue des jeux EasyTech
scripts/
  gen_units.py                # Générateur des 38 JSON (data + perks)
public/                       # Assets statiques (placez les screenshots ici)
```

## Déploiement Vercel

### Option A — depuis ce dossier (recommandé après auth Vercel)

Une fois le connecteur Vercel autorisé dans Cowork :
```
deploy_to_vercel  # via le MCP Vercel
```
Retournera une URL preview du type `easytech-wiki-xxx.vercel.app`.

### Option B — manuel via Vercel CLI

```bash
npx vercel login
npx vercel             # premier déploiement (preview)
npx vercel --prod      # déploiement production
```

### Option C — via GitHub + import Vercel

1. Créer un repo `lioalexandre-procurementor/easytech-wiki-fr` sur github.com
2. Pousser :
```bash
git remote add origin git@github.com:lioalexandre-procurementor/easytech-wiki-fr.git
git push -u origin main
```
3. Sur vercel.com → New Project → Import → sélectionner le repo. Aucune configuration nécessaire (Next.js détecté).

## Édition du contenu

Toutes les fiches d'unités sont des fichiers JSON dans `data/wc4/elite-units/`. Pour modifier une stat ou un perk, éditer le fichier correspondant — pas besoin de toucher au code.

Pour ajouter une unité :
1. Créer `data/wc4/elite-units/mon-unite.json` avec la même structure
2. L'ajouter à `_index.json`
3. Rebuilder : la page `/world-conqueror-4/unites-elite/mon-unite` est créée automatiquement

Pour régénérer en masse depuis le script source :
```bash
python3 scripts/gen_units.py
```

## Champs d'une unité

```ts
{
  slug, name, category, country, countryName, tier,
  obtainability,                  // free | event | shop | premium
  shortDesc, longDesc,
  stats: { perLevel: [{level, attack, defense, hp, movement, range}] },
  perks: [{level, type, name, description, value?}],   // type: active-skill | passive | stat
  recommendedGenerals: string[],
  levelingPriority: string[],     // étapes ordonnées (HTML autorisé)
  faqs: [{q, a}],
  verified: boolean,              // false = données extrapolées à valider en jeu
  sources?: string[]
}
```

## Roadmap contenu

Voir `CONTENT-WORKFLOW.md` pour le pipeline éditorial et `SCREENSHOT-GUIDE.md` pour la capture via émulateur Android (BlueStacks / LDPlayer).
