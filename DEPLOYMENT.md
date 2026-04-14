# Déploiement — étapes restantes

Le projet est buildable et committé en local (`git log` montre le commit initial). Les étapes ci-dessous nécessitent ton action.

## 1. Autoriser le connecteur Vercel dans Cowork (recommandé)

C'est le plus rapide. Une fois le connecteur authentifié dans Cowork :
- Je peux appeler `deploy_to_vercel` sans GitHub
- Tu obtiens une URL preview en ~2 minutes
- Pas besoin de créer un repo GitHub maintenant (peut être ajouté plus tard)

**Action :** dans Cowork → connecteurs → activer Vercel → autoriser. Ensuite redemande-moi de déployer.

## 2. Alternative — push GitHub puis import Vercel

Si tu préfères passer par GitHub (recommandé à terme pour le CI/CD) :

```bash
cd "/path/to/easytech-wiki"

# Sur github.com, créer le repo public ou privé : lioalexandre-procurementor/easytech-wiki-fr
# (sans README, sans gitignore, vide)

git remote add origin https://github.com/lioalexandre-procurementor/easytech-wiki-fr.git
git push -u origin main
```

Puis sur **vercel.com** :
1. New Project → Import Git Repository
2. Sélectionner `easytech-wiki-fr`
3. Framework Preset : Next.js (auto-détecté)
4. Aucune variable d'environnement nécessaire
5. Deploy

URL preview disponible en 1-2 min, type `easytech-wiki-fr-xxx.vercel.app`.

## 3. Alternative locale — Vercel CLI sans GitHub

Sur ta machine :

```bash
cd easytech-wiki
npx vercel login          # ouvre le navigateur, login email
npx vercel                # premier déploiement → preview
npx vercel --prod         # promouvoir en production
```

## Configuration recommandée post-deploy

### Domaine

Quand un domaine est acheté (ex : `easytechwiki.fr`) :
- Vercel → Project Settings → Domains → ajouter `easytechwiki.fr` et `www.easytechwiki.fr`
- Configurer le DNS chez le registrar (CNAME → cname.vercel-dns.com)

### Variables d'environnement

Aucune n'est requise pour cette version. À ajouter plus tard :
- `NEXT_PUBLIC_GA_ID` quand Google Analytics est branché
- `NEXT_PUBLIC_ADSENSE_ID` quand AdSense est validé

### Search Console

Une fois en prod :
1. Ajouter la propriété sur https://search.google.com/search-console
2. Vérification via balise meta (à ajouter dans `app/layout.tsx`)
3. Soumettre le sitemap : `https://[domaine]/sitemap.xml` (à générer — voir Phase 2)

### Sitemap (à ajouter)

Créer `app/sitemap.ts` :
```typescript
import { getAllSlugs } from "@/lib/units";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://easytechwiki.fr"; // changer
  const units = getAllSlugs().map(slug => ({
    url: `${base}/world-conqueror-4/unites-elite/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [
    { url: base, priority: 1.0 },
    { url: `${base}/world-conqueror-4`, priority: 0.9 },
    { url: `${base}/world-conqueror-4/unites-elite`, priority: 0.8 },
    ...units,
  ];
}
```

Ce fichier n'a **pas** été créé par défaut car l'URL de prod n'est pas encore connue. À ajouter dès que tu as le domaine.

## Status actuel

✓ Build local validé (44 pages générées)
✓ Git initialisé, commit initial fait (`1ad93bd`)
✓ Documentation : README, CONTENT-WORKFLOW, SCREENSHOT-GUIDE, DEPLOYMENT
✗ Push GitHub : à faire (besoin de tes credentials)
✗ Déploiement Vercel : à faire (besoin de l'OAuth ou CLI login)
