# Plan — Système de vote pour les compétences entraînées des généraux

## Contexte

Dans World Conqueror 4, certains généraux disposent d'une **version entraînée** à l'Académie : quand on dépense des médailles/pièces, le général peut reconfigurer une ou deux de ses compétences (slots). Chaque slot entraînable propose **plusieurs skills candidates** parmi lesquelles le joueur choisit. Le "meta" communautaire change selon patchs et modes (conquête, rivalité, défi).

On veut, sur chaque fiche général entraînable :

1. **Une section "Compétences recommandées"** pré-remplie par nous avec la meta actuelle (best practice éditoriale).
2. **Un vote communautaire** pour le slot 1 (et le slot 2 s'il existe).
3. Par défaut, afficher **le top 3 par nombre de votes** pour chaque slot.
4. Un bouton **"Voter"** qui ouvre une liste déroulante de toutes les skills possibles pour ce slot, l'utilisateur choisit sa préférée, confirme.
5. Des garde-fous **anti-abus** raisonnables (sans viser un niveau bancaire).

---

## Architecture générale

Le site est aujourd'hui en **Next.js 14 static export** (SSG pur). Pour permettre des votes qui changent en continu sans re-déployer, il faut ajouter un minuscule backend. Deux dimensions à décider : (a) où stocker les votes, (b) comment exécuter la logique de vote.

### Option recommandée : Vercel + Vercel KV (Redis géré)

**Stack** :
- Déployer sur **Vercel** (le site Next est déjà compatible — on passe `output: 'static'` à `output: 'standalone'` ou on garde static + on ajoute une route API).
- **Vercel KV** (Redis managé) pour stocker les compteurs. Free tier : 30k commandes/jour, 256 Mo — largement suffisant pour un wiki de niche.
- **Route API Next.js** (`app/api/vote/route.ts`) pour enregistrer un vote et lire les résultats.
- **Composant client React** qui fait `fetch('/api/vote')` pour afficher les comptes et poster un vote.
- Les pages généraux restent **statiques** (SSG) — le composant vote est un îlot `"use client"` qui hydrate côté client au moment du render. Aucune régénération SSG nécessaire.

**Pourquoi KV plutôt qu'une base SQL** : les opérations sont purement INCR (incrément atomique). Redis c'est parfait pour ça, aucune migration, pas de schéma. Et c'est le plus simple à maintenir.

**Alternatives viables** :
- **Upstash Redis** (équivalent, gratuit, multi-hébergeur — bien si vous ne voulez pas être liés à Vercel).
- **Turso** (SQLite distribué, gratuit généreux) — si plus tard vous voulez des tables de commentaires, préférer celui-ci dès maintenant.
- **Supabase** (Postgres hébergé) — overkill pour un simple compteur.
- **Cloudflare Workers + D1** — excellent, mais nécessite d'adapter le déploiement hors Vercel.

### Modèle de données Redis (hash par général/slot)

```
Key: vote:wc4:gen:{slug}:slot{N}
Type: Hash
Fields:
  {skill_id}: count (integer)
  __total: total count (integer)
```

Exemple concret :

```
vote:wc4:gen:guderian:slot1 → {
  "blitzkrieg-mastery": 142,
  "armor-genius": 88,
  "panzer-lord": 67,
  "desert-fox": 12,
  "__total": 309
}
```

Pour stocker qu'un visiteur a déjà voté sur un slot donné :

```
Key: vote:wc4:voter:{voter_hash}
Type: Set
Members: "gen:guderian:slot1", "gen:rommel:slot2", ...
TTL: 30 jours (glissante — on remet à 30 j à chaque nouveau vote)
```

On n'identifie pas l'utilisateur par email/login. Le `voter_hash` est une empreinte que le serveur calcule à partir de : `sha256(ip + user_agent + secret_salt)`. Pas d'opt-in cookies requis (pas de tracking publicitaire, juste de l'anti-abus).

---

## Modèle de données côté wiki (trained skills candidates)

Ajouter dans `lib/types.ts` :

```ts
export interface TrainedSkillCandidate {
  id: string;           // slug unique ex: "blitzkrieg-mastery"
  name: string;         // "Maîtrise Blitzkrieg"
  desc: string;         // description complète FR
  rating?: SkillRating | null;  // grade E→S+ affiché en jeu
  stars?: number | null;
  icon?: string | null;
  popularMeta?: boolean; // true = notre recommandation éditoriale
}

export interface TrainedSkillSlot {
  slot: 1 | 2;
  candidates: TrainedSkillCandidate[];
  recommended?: string;   // id de la candidate qu'on recommande par défaut
  recommendationReason?: string;  // "Meilleur DPS pour conquête 1980"
}

export interface TrainedForm {
  // ... existant ...
  trainedSlots?: TrainedSkillSlot[];  // NEW — liste des slots entraînables
}
```

Les données sources restent dans `lib/data/generals/<slug>.json`. Seeder en `verified: false` jusqu'à vérification émulateur.

---

## Composant UI (Îlot client)

Fichier : `components/TrainedSkillVote.tsx` — marqué `"use client"`.

### Props
```ts
interface Props {
  generalSlug: string;
  slot: TrainedSkillSlot;
  // Le serveur peut pre-fetch les initialCounts pour éviter un flash
  initialCounts?: Record<string, number>;
}
```

### États visuels

**État par défaut (lecture)** — ressemble à un mini podium :

```
┌──────────────────────────────────────────────────┐
│  Slot 1 — Compétences recommandées               │
│                                                  │
│  ⭐ Notre pick : Maîtrise Blitzkrieg (S+)        │
│  "Meilleur DPS pour conquête 1980"               │
│  ─────────────────────────────────────────────   │
│  TOP 3 VOTES COMMUNAUTÉ                          │
│  🥇 Maîtrise Blitzkrieg        142  (46%)        │
│  🥈 Génie Blindé                88  (28%)        │
│  🥉 Seigneur Panzer             67  (22%)        │
│                                                  │
│  [    🗳 Voter pour votre préférée    ]          │
│  309 votes au total                              │
└──────────────────────────────────────────────────┘
```

**État "voter"** : clic sur le bouton → ouvre un `<Dialog>` (ou modal natif) avec **toutes les candidates** (pas juste le top 3), scrollable, chaque ligne est cliquable avec nom + description + grade + nombre actuel de votes. Radio boutons. CTA "Confirmer mon vote".

**État post-vote** : remplacer le bouton par `✓ Merci — votre vote a été compté (valable 30 j)`.

### Hook React

```ts
function useSlotVotes(generalSlug: string, slotNum: 1 | 2) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/vote?general=${generalSlug}&slot=${slotNum}`)
      .then(r => r.json())
      .then(data => {
        setCounts(data.counts);
        setHasVoted(data.hasVoted);
        setLoading(false);
      });
  }, [generalSlug, slotNum]);
  
  const submitVote = async (skillId: string) => {
    const r = await fetch('/api/vote', {
      method: 'POST',
      body: JSON.stringify({ general: generalSlug, slot: slotNum, skill: skillId }),
    });
    if (r.ok) {
      const data = await r.json();
      setCounts(data.counts);
      setHasVoted(true);
    }
  };
  
  return { counts, hasVoted, loading, submitVote };
}
```

Côté UX : afficher un **fallback squelette** pendant `loading`. Si l'API échoue, dégrader silencieusement à "Notre recommandation" seule + masquer le bouton vote. Jamais de bloquage.

---

## Route API `app/api/vote/route.ts`

```ts
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const VOTE_TTL_DAYS = 30;

function voterHash(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  const salt = process.env.VOTE_SALT || 'fallback-salt-rotate-me';
  return createHash('sha256').update(`${ip}|${ua}|${salt}`).digest('hex').slice(0, 16);
}

function voteKey(general: string, slot: number) {
  return `vote:wc4:gen:${general}:slot${slot}`;
}

// GET /api/vote?general=guderian&slot=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const general = searchParams.get('general');
  const slot = Number(searchParams.get('slot'));
  if (!general || ![1, 2].includes(slot)) {
    return NextResponse.json({ error: 'bad params' }, { status: 400 });
  }
  const counts = (await kv.hgetall(voteKey(general, slot))) || {};
  const hv = voterHash(req);
  const hasVoted = await kv.sismember(`vote:wc4:voter:${hv}`, `${general}:${slot}`);
  delete counts.__total;
  return NextResponse.json({ counts, hasVoted: Boolean(hasVoted) });
}

// POST /api/vote  body: { general, slot, skill }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { general, slot, skill } = body;
  if (!general || ![1, 2].includes(slot) || !skill) {
    return NextResponse.json({ error: 'bad params' }, { status: 400 });
  }

  // Valider le skill contre la whitelist serveur (anti-injection)
  const allowed = await isAllowedSkill(general, slot, skill);  // lit le JSON
  if (!allowed) return NextResponse.json({ error: 'unknown skill' }, { status: 400 });

  const hv = voterHash(req);
  const voterSetKey = `vote:wc4:voter:${hv}`;
  const voteTag = `${general}:${slot}`;

  // Vérifie si ce hash a déjà voté
  const already = await kv.sismember(voterSetKey, voteTag);
  if (already) {
    return NextResponse.json({ error: 'already voted' }, { status: 429 });
  }

  // Rate limit : max 10 votes / heure par hash (anti-bot grossier)
  const rlKey = `vote:rl:${hv}`;
  const rl = await kv.incr(rlKey);
  if (rl === 1) await kv.expire(rlKey, 3600);
  if (rl > 10) return NextResponse.json({ error: 'rate limit' }, { status: 429 });

  // Incrémenter atomiquement
  await kv.hincrby(voteKey(general, slot), skill, 1);
  await kv.hincrby(voteKey(general, slot), '__total', 1);
  await kv.sadd(voterSetKey, voteTag);
  await kv.expire(voterSetKey, VOTE_TTL_DAYS * 86400);

  const counts = await kv.hgetall(voteKey(general, slot));
  delete counts.__total;
  return NextResponse.json({ counts, hasVoted: true });
}
```

---

## Garde-fous anti-abus

Classés par coût d'implémentation / rapport utilité :

### Niveau 1 — obligatoire (déjà couvert ci-dessus)

1. **Whitelist serveur des skills** : le client envoie un `skillId`, le serveur refuse tout ID qui n'est pas dans la liste des candidates définies pour ce slot de ce général. Empêche l'injection de spam (`skill=free-robux`).
2. **Un vote par slot par hash** : stocké 30 jours glissants dans Redis SET. Après 30 j, le vote peut être re-soumis (le meta a pu changer).
3. **Rate limit** 10 votes / heure / hash (tous généraux confondus). Un humain normal n'atteindra jamais ça.
4. **Méthode POST uniquement** + validation Content-Type JSON → empêche les GET spammés via `<img>` tags.
5. **SALT serveur** rotatable via variable d'env. Si on détecte un flood, on change le salt → tous les hashs sont invalidés → les voteurs légitimes revoteront, les bots aussi mais seront détectés.

### Niveau 2 — si on voit de l'abus

6. **Cookie HttpOnly signé** en plus du hash : au premier vote, on pose un cookie `vote-id=<uuid>`, côté serveur on stocke ce cookie ∈ SET. Croisé avec le IP-hash, rend le spoofing plus difficile. Léger impact RGPD (cookie technique, pas de banner requis en UE car fonction essentielle du service).
7. **Cloudflare Turnstile** (équivalent CAPTCHA sans friction, gratuit, privacy-first) déclenché uniquement si le rate limit se rapproche ou si l'IP est sur une liste Tor/datacenter. Turnstile ne casse pas l'UX comme reCAPTCHA.
8. **Logger les votes** dans un stream Redis (`XADD`) pour audit — si on suspecte un raid, on peut rejouer et décompter.
9. **Double-submit token** : la GET pose un token signé en header, le POST doit le renvoyer. Bloque les bots CSRF basiques.

### Niveau 3 — overkill pour un wiki de niche

10. Intégration hCaptcha / reCAPTCHA v3 obligatoire (ruine l'UX).
11. Login obligatoire via Google/Discord (ruine la barrière d'entrée).
12. Proof-of-work côté client (délai de 5 s pour soumettre un vote).

**Ma recommandation** : niveau 1 tout de suite, niveau 2 point 6 (cookie) ajouté dès le départ car trivial et quasi-gratuit. Turnstile à brancher plus tard si nécessaire.

### Note sur les faux positifs IP partagée

Le risque classique : plusieurs joueurs derrière le même NAT (universités, cybercafés) ne peuvent voter qu'une fois. Solution acceptable pour un wiki niche : le cookie (niveau 2 #6) désambiguïse deux navigateurs sur la même IP. Pour les cas pathologiques, tant pis — on accepte un bruit statistique.

---

## Transparence

Afficher sous le widget :
> *Votes anonymes — un vote par préférence pendant 30 jours. Voir la [politique de modération](/legal/votes).*

Et créer une page légère `/legal/votes` expliquant qu'on ne stocke ni IP ni compte, seulement un hash éphémère.

---

## Plan d'implémentation

### Phase 0 — décisions à valider avec Alex
1. Hébergement final : **Vercel KV** (recommandé) ou **Upstash/Turso** ?
2. Whose rules on the "Top 3" : tri strict par votes, ou bien tri par votes *avec* un tag "⭐ Notre pick" toujours visible au-dessus (même si 4ème en votes) ?
3. Durée du verrouillage du vote : **30 j** ou plus court (7 j) / plus long (permanent) ?

### Phase 1 — schéma et data
- Étendre `TrainedForm` avec `trainedSlots: TrainedSkillSlot[]` dans `lib/types.ts`.
- Mettre à jour `scripts/gen_generals.py` pour générer des slots vides (candidates: []) sur les 4 généraux entraînables déjà seeded (Guderian, Rommel, Rokossovsky, Kuznetsov).
- Après vérification émulateur, remplir les candidates avec vraies données.

### Phase 2 — backend
- Ajouter `@vercel/kv` aux deps.
- Créer `app/api/vote/route.ts` (code complet ci-dessus).
- Ajouter `lib/vote-whitelist.ts` qui lit `_index.json` et retourne la liste autorisée.
- Variable env `VOTE_SALT` générée aléatoirement, stockée dans Vercel.

### Phase 3 — frontend
- Créer `components/TrainedSkillVote.tsx` (client component).
- L'intégrer dans `app/world-conqueror-4/generaux/[slug]/page.tsx`, section **Version entraînée**, conditionnel : `if (general.trained?.trainedSlots)` afficher `<TrainedSkillVote>` par slot.
- Styles alignés sur la palette militaire existante (gold2 / panel / border).

### Phase 4 — déploiement
- Basculer le build Next vers mode hybride (pages statiques + route API dynamique).
- Déployer sur Vercel, brancher Vercel KV.
- Tester avec 5-10 votes manuels.

### Phase 5 — SEO check
- Les votes étant chargés côté client, Google ne les indexe pas → c'est **voulu** (on ne veut pas ré-indexer la page à chaque vote). La partie **Compétences recommandées** reste 100% SSR et SEO-friendly.
- Vérifier que le composant vote n'introduit pas de CLS (cumulative layout shift) — réserver la hauteur via `min-height`.

### Phase 6 — monitoring (optionnel mais recommandé)
- Ajouter un mini-endpoint `/api/vote/stats` admin protégé par header secret qui retourne le total de votes par général + le TTL moyen.
- Alerter si un général passe de 0 à 10k votes en 1h (= attaque).

---

## Questions ouvertes à trancher avec Alex

Voir `AskUserQuestion` pour les décisions clés.

## Estimation temps

- Phase 1 : 30 min
- Phase 2 : 1 h
- Phase 3 : 2 h
- Phase 4 : 30 min (si Vercel KV déjà provisionné)
- Total : **~4 h** de code net + 30 min de vérification
