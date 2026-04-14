# Guide capture d'écran — Émulateur Android pour WC4

WC4 (et la plupart des jeux EasyTech) sont mobile-only. Pour produire des screenshots HD éditoriaux, on passe par un émulateur Android sur PC.

## Choix de l'émulateur

| Émulateur | OS | Avantage | Limite |
|---|---|---|---|
| **BlueStacks 5** | Win/Mac | Le plus stable, support multi-instances | Pubs intégrées, ~4 GB RAM minimum |
| **LDPlayer 9** | Win | Le plus rapide pour mobile gaming, F12 = screenshot direct | Windows uniquement |
| **MEmu Play** | Win | Léger, supporte les anciens jeux | Updates moins fréquentes |
| **Genymotion** | Win/Mac/Linux | Pro, scriptable (CLI) | Payant pour usage commercial |
| **Android Studio AVD** | Win/Mac/Linux | Officiel Google, gratuit | Plus lourd, setup plus long |

**Recommandation pour ce projet :** LDPlayer 9 (Windows) ou BlueStacks 5 (cross-platform). Les deux supportent WC4 sans problème depuis le Play Store.

## Setup minimal

1. Installer LDPlayer ou BlueStacks
2. Configurer l'instance en **résolution 1920×1080** (ou 2560×1440 si machine puissante) — important pour des screenshots nets
3. DPI : 240 (équivalent tablette) — meilleur rendu UI que mode téléphone
4. Se connecter au Play Store Google avec un compte dédié
5. Installer "World Conqueror 4" (EasyTech) — gratuit
6. Lancer une fois et compléter le tutoriel pour débloquer l'écran d'unités

## Captures à produire

### Pour chaque fiche unité (38 unités × ~6 captures = ~230 images)

Dans le menu Unités d'élite > [Unité sélectionnée] :
1. **Fiche complète niveau 1** — recadrer sur la zone unit card, ratio 16:9
2. **Fiche complète niveau 5** — milestone 1
3. **Fiche complète niveau 9** — milestone 2
4. **Fiche complète niveau 12** — milestone final (perk ultime visible)
5. **Icône isolée** — capturer juste l'icône, fond transparent (post-prod GIMP/Photoshop)
6. **Unité en combat** (optionnel) — bonus pour les fiches stars

### Pour le hub WC4

- Splash screen WC4
- Carte du monde mode Conquête (ratio 21:9, hero image)
- Écran de bataille avec plusieurs unités
- Menu généraux (illustration de la section "Généraux")

## Pipeline de capture

```
Émulateur    →   Screenshot (PNG 1920×1080)
                 ↓
              Squoosh.app  →  Crop + WebP qualité 80
                 ↓
              public/units/{slug}.webp  (~50-150 KB chacun)
                 ↓
              Modifier components/UnitIcon.tsx pour préférer le WebP si présent
```

### Convention de nommage

```
public/
  units/
    a41-centurion.webp           # icône principale
    a41-centurion-lvl12.webp     # screenshot niveau max
    a41-centurion-combat.webp    # optionnel
  hero/
    wc4-hero.webp                # bannière hub WC4
    wc4-conquest-map.webp        # carte mode Conquête
```

## Astuce : automatisation des captures

Si tu fais 230 captures à la main, c'est ~5h. Pour scripter avec ADB (Android Debug Bridge) :

```bash
# Activer le mode debug dans LDPlayer (Settings → Other → ADB activé)
adb devices                                          # vérifier connexion
adb shell screencap -p /sdcard/wc4_capture.png       # screenshot dans l'émulateur
adb pull /sdcard/wc4_capture.png ./public/units/    # télécharger
```

Combiné avec un petit script Python qui :
1. Tape les coordonnées des boutons (`adb shell input tap X Y`)
2. Attend 500ms
3. Capture
4. Renomme selon le slug

→ tu réduis le temps à ~30min pour les 38 unités. Le script peut être ajouté à `scripts/capture.py` une fois LDPlayer installé.

## Considérations légales

- Les **screenshots de jeu** sont en zone grise mais largement tolérés pour les wikis communautaires (fair use, but vérifier les CGU EasyTech)
- Mentionner "© EasyTech, screenshots à usage informationnel" dans le footer du wiki
- **Ne pas utiliser** les assets graphiques (icônes, illustrations) du jeu hors contexte editorial (ex : pas de t-shirt avec un Tiger King)
- Le format WebP recompressé à 80% qualité change la signature de l'image : suffisant pour ne pas être flaggé en duplicate content

## Alternative : génération AI

Pour les **assets décoratifs uniquement** (bannière hub, illustrations de catégorie, images d'arrière-plan) :
- Midjourney / DALL-E : "WW2 era tank silhouette, military poster style, sepia tones, no text" 
- Stable Diffusion local : ControlNet pour générer des silhouettes cohérentes par catégorie

⚠️ **Ne pas générer en AI les fiches d'unités elles-mêmes** : cela créerait de la confusion sur les vraies stats. Réserver l'AI pour la décoration.

## Checklist post-capture

Pour chaque batch d'images :
- [ ] Compression WebP (cible <150 KB par image)
- [ ] Dimensions cohérentes (256×256 pour icônes, 1920×1080 pour screenshots)
- [ ] Nommage selon convention (slug du JSON)
- [ ] Alt text descriptif dans le composant UnitIcon (SEO image)
- [ ] Vérifier `npm run build` après ajout (taille du bundle public)

## Outils utiles

- **Squoosh** (squoosh.app) — compression web image, drag&drop, gratuit
- **Remove.bg** — fond transparent automatique pour les icônes
- **Sharp** (Node.js) — pipeline de compression scriptable
- **Photopea** (photopea.com) — Photoshop gratuit dans le navigateur
