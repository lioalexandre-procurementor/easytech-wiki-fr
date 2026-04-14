# Content Workflow — EasyTech Wiki FR

Pipeline éditorial pour produire du contenu wiki à grande échelle, optimisé SEO français.

## Principe directeur

Le wiki gagne en référencement Google FR si chaque page :
1. Répond à une intention de recherche précise (ex : "perks A41 Centurion niveau 9")
2. Affiche la donnée au-dessus de la ligne de flottaison (slider stats, tableau perks)
3. A un FAQ block répondant à 3-5 questions long-tail
4. Lie vers 3-5 unités/concepts proches (maillage interne)
5. A au moins 1 visuel — idéalement un screenshot in-game (voir SCREENSHOT-GUIDE.md)

## Pipeline en 4 étapes

### 1. Recherche (par batch de 5-10 unités)

**Sources primaires :**
- NamuWiki KR (le plus complet) — utiliser DeepL/Google Translate
- WC4 Fandom EN — souvent moins détaillé mais structuré
- Reddit r/WorldConqueror4 — perks récents post-mise à jour
- YouTube guides FR/EN — vérification visuelle des effets

**Données à extraire pour chaque unité :**
- Stats lvl 1 et lvl 12 (interpolation linéaire pour le reste)
- Liste des 8-13 perks débloqués entre lvl 1 et 12
  - Marquer le type : `active-skill`, `passive`, `stat`
  - Niveaux clefs : 5, 9, 12 (milestones)
- 2-3 généraux recommandés (synergies de bonus)
- Pays / faction d'origine
- Mode d'obtention : free / event / shop / premium

**Output :** un fichier JSON par unité dans `data/wc4/elite-units/`. Tant que la donnée n'est pas vérifiée en jeu, laisser `verified: false` (un badge ⚠️ s'affiche automatiquement).

### 2. Vérification in-game (par batch de 10 unités)

Sur émulateur Android (voir SCREENSHOT-GUIDE.md) :
1. Lancer WC4, mode Conquête
2. Acheter/sélectionner l'unité d'élite
3. Pour chaque niveau (1, 5, 9, 12), screenshot de la fiche unité
4. Comparer aux stats du JSON, corriger
5. Passer `verified: true` une fois validé

**Astuce :** capturer aussi l'icône de l'unité (PNG ~256x256) pour remplacer le SVG fallback. Placer dans `public/units/{slug}.png` puis modifier `components/UnitIcon.tsx` pour préférer le PNG si présent.

### 3. Enrichissement éditorial

Pour chaque fiche, ajouter manuellement :
- `longDesc` : 2-3 phrases sur l'historique de l'unité (contexte WW2)
- `levelingPriority` : ordre d'investissement XP justifié
- `faqs` : 3-5 questions copiées du Reddit/Discord communautaire
- `recommendedGenerals` : avec un mini-rationnel dans la réponse FAQ

**Tip SEO :** intégrer naturellement les keywords longue traîne :
- "comment débloquer [unité] WC4"
- "[unité] vs [unité] World Conqueror 4"
- "meilleur général pour [unité]"
- "[unité] niveau 12 perks"

### 4. Maillage et publication

- Ajouter l'unité à `_index.json` (déjà fait par le script Python)
- Vérifier que la page apparaît dans `/world-conqueror-4/unites-elite`
- Vérifier les "related units" en bas de fiche (3 unités même catégorie)
- `npm run build` puis `git push` → Vercel auto-deploy

## Cadence cible

| Phase | Cadence | Volume |
|---|---|---|
| Bootstrap (actuel) | one-shot | 38 unités élite WC4 (✓ fait, données extrapolées) |
| Vérification | 10/semaine | 38 unités validées en 4 semaines |
| Enrichissement | 5/semaine | FAQ + visuels custom |
| Expansion généraux | 175 généraux WC4 | ~3 mois à 15/sem |
| EW7 + GCR | ~150 unités combinées | Q3 2026 |

## Métriques à suivre (Search Console)

À paramétrer dès le déploiement :
- Impressions par fiche unité (cible : >500 / mois après 3 mois)
- CTR moyen (cible : >5%)
- Position moyenne sur la requête `[nom unité] WC4` (cible : top 3)
- Temps moyen sur page (cible : >2min sur fiches élite)

## Outils de production

| Besoin | Outil |
|---|---|
| Traduction NamuWiki | DeepL Pro (limite gratuite OK pour ce volume) |
| Capture émulateur | BlueStacks 5 ou LDPlayer 9 (gratuits) |
| Édition image | Squoosh.app (compression WebP) |
| Vérification SEO | Ahrefs Webmaster Tools (gratuit) + Search Console |
| Suivi des perks après mise à jour | Reddit r/WorldConqueror4 + RSS |

## Mises à jour du jeu

EasyTech publie ~2 patchs majeurs par an pour WC4. Procédure :
1. Surveiller les patch notes sur le Discord officiel
2. Lister les unités modifiées
3. Re-vérifier les stats sur émulateur
4. Ajouter une note `[Maj YYYY-MM]` dans la `longDesc` si l'unité a changé significativement
5. Le `verified` reste `true` mais la date du patch est mentionnée
