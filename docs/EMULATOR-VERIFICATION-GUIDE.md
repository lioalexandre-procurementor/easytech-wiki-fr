# Guide de vérification — Émulateur Android pour World Conqueror 4

Objectif : installer World Conqueror 4 dans un émulateur Android sur PC/Mac, naviguer méthodiquement dans les menus pour **vérifier les données du wiki** et **capturer des screenshots propres** à intégrer dans `public/images/`.

Temps estimé : 30 min de setup + ~3-4 heures de collecte (répartissables en sessions de 30 min).

---

## 1. Installer l'émulateur (LDPlayer recommandé)

**Pourquoi LDPlayer** : gratuit, optimisé pour les jeux mobiles, résolution personnalisable jusqu'à 1920×1080, F1 pour screenshot direct dans un dossier fixe, ne met pas de watermark. Alternatives acceptables : BlueStacks 5 (plus lourd), MEmu (similaire).

### Étapes Windows

1. Télécharger LDPlayer 9 depuis [fr.ldplayer.net](https://fr.ldplayer.net/) (≈600 Mo).
2. Lancer l'installateur `LDPlayer9_fr_xxx.exe`, accepter, installer dans `C:\LDPlayer\LDPlayer9`.
3. Au premier lancement, LDPlayer télécharge l'image Android (Android 9, 64-bit) — ~2 min.
4. **Régler la résolution** : icône ⚙ en haut à droite → Avancé → Résolution : `1920 × 1080` (paysage) → DPI : `240` → Appliquer → redémarrer l'instance. C'est la résolution idéale pour screenshots — images nettes, lisibles, format 16:9.
5. **Régler la langue** : dans Android (à l'intérieur de l'émulateur) → Paramètres → Système → Langues → Français. Les textes du jeu utiliseront alors la langue FR si disponible.

### Étapes macOS

LDPlayer ne tourne pas nativement sur Mac. Deux options :
- **BlueStacks 5** (recommandé Mac) : [bluestacks.com](https://www.bluestacks.com/fr/index.html) — installer, créer une instance Android 9, résolution 1920×1080 dans Paramètres → Affichage.
- **Android Studio Emulator** (plus technique) : installer Android Studio, créer un AVD Pixel 6 avec Android 13, lancer, installer Play Store via `adb`.

---

## 2. Installer World Conqueror 4

1. Ouvrir le **Google Play Store** dans l'émulateur (icône pré-installée).
2. Se connecter avec un compte Google (créer un compte jetable recommandé — pas le compte principal).
3. Chercher `World Conqueror 4` — éditeur : **EasyTech**.
4. Installer (~400 Mo).
5. Au premier lancement :
   - Accepter les CGU.
   - **Choisir "Français"** si demandé. Sinon : Menu → Options → Language → Français.
   - Passer le tutoriel rapidement (on vérifiera les données hors tuto).
   - **Important** : lier le compte Google Play Games à la fin du tuto pour sauvegarder la progression.

---

## 3. Créer un point de sauvegarde rapide (snapshot)

LDPlayer permet de cloner l'instance — très utile si vous voulez comparer deux états (ex : avant/après entraînement d'un général) sans refaire le grinding.

**LDPlayer** : LDMultiplayer (icône hub) → clic droit sur l'instance → Cloner. Vous aurez deux instances : `WC4-Main` (pour grinding) et `WC4-Snapshot` (lecture seule, référence).

**BlueStacks** : Multi-Instance Manager → + → Duplicate instance.

Renommer les instances explicitement.

---

## 4. Préparer le pipeline de screenshots

### Dossier de sortie
LDPlayer : touche **F1** → screenshot PNG dans `C:\Users\<vous>\Pictures\LDPlayer\Screenshots\`. Épingler ce dossier dans l'Explorateur.

### Convention de nommage
Pour faciliter le tri, renommer chaque screenshot selon :

```
<type>_<slug>_<vue>.png

Exemples :
unit_t34_stats_l1.png
unit_t34_stats_l12.png
unit_t34_perks.png
general_guderian_base.png
general_guderian_trained.png
general_guderian_attributes.png
scorpion_wraith_i_stats.png
```

Créer un dossier de travail `wc4-screens/` et trier au fur et à mesure. Les images finales iront dans `public/images/units/<slug>.png` et `public/images/generals/<slug>.png` après recadrage.

### Recadrage / export web
Utiliser **ShareX** (Windows) ou **CleanShot X** (Mac) pour rogner + exporter en WebP à 1280px de large (qualité 85). Cela réduit à ~80 Ko par image sans perte visible. Commande batch avec `sharp-cli` possible :

```bash
npx sharp-cli -i "wc4-screens/*.png" -o "public/images/units/" --format webp --quality 85 --width 1280
```

---

## 5. Workflow de vérification — passes A à E

Plutôt que de vérifier chaque unité séquentiellement (trop long, trop de context switching), utiliser un **workflow horizontal par type de donnée**. Le tracker XLSX `docs/WC4-Verification-Tracker.xlsx` (déjà généré) contient une colonne par passe.

### Passe A — Roster complet (30 min)
**But** : confirmer que nos 50 unités + 13 généraux existent bien dans le jeu.

1. Dans le jeu, ouvrir **Général en chef → Académie → Généraux** : défiler la liste complète. Pour chaque entrée, marquer ✓ dans la colonne "Verified" du tracker ou l'ajouter à la feuille `Roster Backlog` si c'est un général pas encore catalogué.
2. Même chose pour **Arsenal → Unités d'élite** (ou équivalent selon version FR).
3. Rapporter tout général/unité trouvé qui n'est pas dans notre liste → feuille **Roster Backlog**.

### Passe B — Stats numériques (1 h)
**But** : remplir les colonnes ATK/DEF/HP L1 et L12 de chaque unité.

1. Ouvrir **Arsenal → Unités d'élite → [unité]**.
2. Screenshot F1 de la fiche niveau 1 → `unit_<slug>_stats_l1.png`.
3. Passer la fiche au niveau max (bouton "+" ou slider) pour voir les stats niveau 12 → screenshot → `unit_<slug>_stats_l12.png`.
4. Reporter les chiffres ATK / DEF / HP dans le tracker. Marquer "Stats L1 OK" et "Stats L12 OK" en ✓.

**Astuce** : faire 10-15 unités par session, pas plus. Fatigue = erreurs.

### Passe C — Perks / compétences passives (1 h)
**But** : vérifier les 12 paliers de perks de chaque unité.

1. Sur la même fiche unité, aller dans l'onglet **Compétences** / **Perks**.
2. Screenshot de chaque palier (L1, L3, L5, L7, L9, L11, L12 typiquement) → `unit_<slug>_perks.png` (composite) ou `unit_<slug>_perk_l<N>.png`.
3. Traduire les descriptions EN → FR si le jeu est en anglais dans votre version.
4. Marquer "Perks OK" en ✓.

### Passe D — Généraux : skills + ratings + attributs (1 h)
**But** : remplir les compétences des 13 généraux avec leur rating (E→S+), stars (0-5), et les 4 attributs (offense / defense / intelligence / charisma).

1. **Général en chef → Académie → Généraux → [général]**.
2. Vue principale : noter les 4 attributs visibles en haut (étoiles) → screenshot → `general_<slug>_base.png`.
3. Onglet **Compétences** : pour chaque slot (1, 2, 3) noter :
   - Nom FR
   - Description FR complète
   - Grade lettre (E/D/C/B/A/S/S+) affiché à côté
   - Nombre d'étoiles si présent
4. Screenshot → `general_<slug>_skills.png`.
5. Reporter dans le tracker.

### Passe E — Versions entraînées + acquisition (30 min)
**But** : pour les généraux marqués `hasTrained=True` dans le tracker (Guderian, Rommel, Rokossovsky, Kuznetsov et les autres à découvrir), capturer leur version post-entraînement.

1. **Académie → onglet "Entraînement"** : vérifier si le général est entraînable.
2. Si oui, consulter les compétences de la **version entraînée** (pas besoin de réellement payer le coût).
3. Noter le coût d'entraînement + la monnaie (médailles / croix de fer / pièces).
4. Screenshot → `general_<slug>_trained.png`.
5. **Acquisition** : dans la liste principale ou le shop, noter comment chaque général s'obtient :
   - Starter (débloqué au début) → `starter`
   - Achetable avec Médailles → `medals` + coût
   - Achetable avec Croix de Fer → `iron-cross` + coût
   - Achetable avec Pièces → `coin` + coût
   - Récompense de campagne → `campaign` + nom mission
   - Événement limité → `event`
6. Reporter dans les colonnes Acquisition du tracker.

---

## 6. Données Empire du Scorpion — attention spéciale

L'Empire du Scorpion (Black Scorpion Empire / Mystic Forces) n'est accessible que via certaines campagnes :
- **Campagne Conquête 1980** pour rencontrer les capitaines.
- **Menu "Challenge" / "Général terroriste"** pour les packs payants qui débloquent Wraith I/II/III comme capitaines jouables.

Les unités Scorpion (Phantom, Revenant, Specter, etc.) n'apparaissent pas dans l'Arsenal standard — elles n'apparaissent **que sur la carte de campagne** comme ennemies. Pour capturer leurs stats :

1. Lancer la mission "Les Dieux vivent" (campagne 1980) ou équivalent.
2. En début de mission, zoomer sur les unités ennemies.
3. Tap long sur une unité Scorpion → fiche info → screenshot.
4. Mettre le jeu en pause et prendre tout le temps nécessaire.

Si les fiches sont cachées, utiliser le **mode "Scénario"** ou fouiller la **galerie du musée** (icône Archives dans certaines versions).

---

## 7. Gestion du temps et batching

Ne pas viser la perfection — viser la **complétude progressive**. Stratégie suggérée :

- **Jour 1** : Passes A + B sur les 10 unités standard Tier S (30 min × 2 = 1 h).
- **Jour 2** : Passe D sur les 10 généraux standard (1 h).
- **Jour 3** : Passe E + disclaimer retiré sur les généraux vérifiés.
- **Jour 4** : Passes B/C sur les 40 unités restantes (étalé sur la semaine).
- **Jour 5** : Faction Scorpion complète.

Après chaque session, commit les données enrichies dans `lib/data/generals/*.json` et `lib/data/units/*.json`, passer `verified: true`, puis rebuild.

---

## 8. Checklist de livraison par unité/général

Une fiche est considérée "verified" quand :

- [ ] Nom FR + EN correct
- [ ] Country + drapeau corrects
- [ ] Stats ATK/DEF/HP L1 et L12 confirmés en jeu
- [ ] Au moins un screenshot sauvegardé dans `public/images/<type>/<slug>.webp`
- [ ] Description FR rédigée en langage naturel (pas de copier-coller direct)
- [ ] `verified: true` dans le fichier JSON
- [ ] Disclaimer "Wiki en construction" retiré de cette page spécifique

---

## 9. Plan B — pas d'émulateur possible

Si l'installation émulateur échoue (certains PC en entreprise bloquent la virtualisation), alternatives :

1. **Demander à un joueur actif de la communauté** (Discord WC4 FR / r/WorldConqueror4) de screenshoter son écran contre un crédit wiki.
2. **Utiliser les vidéos YouTube** de guides tier-list récents — pause frame-by-frame pour lire les stats. Moins fiable, mais OK pour la passe A.
3. **NamuWiki coréen** + Google Translate : [namu.wiki/w/World Conqueror 4](https://namu.wiki/w/World%20Conqueror%204) contient les stats mais en coréen et parfois désynchronisées avec la version FR.

---

## Ressources

- **Tracker de vérification** : `docs/WC4-Verification-Tracker.xlsx` (feuilles Units, Generals, Roster Backlog)
- **Fandom anglais** : [world-conqueror.fandom.com](https://world-conqueror.fandom.com) — base de données communautaire, majoritairement fiable pour le roster standard
- **Discord EasyTech officiel** : lien dans le menu "À propos" du jeu
