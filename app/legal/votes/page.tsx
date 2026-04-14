import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de vote communautaire | EasyTech Wiki FR",
  description:
    "Comment fonctionne le vote communautaire sur les compétences entraînées des généraux : anonymat, garde-fous, durée de vote.",
};

export default function VotesLegalPage() {
  return (
    <>
      <TopBar />
      <div className="max-w-[860px] mx-auto px-6 py-8">
        <div className="text-xs text-muted mb-4">
          <Link href="/" className="text-dim">
            Accueil
          </Link>{" "}
          <span className="mx-2 text-border">›</span>
          <span>Politique de vote</span>
        </div>

        <h1 className="text-3xl text-gold2 font-extrabold mb-2">
          Politique de vote communautaire
        </h1>
        <p className="text-dim text-sm mb-8">
          Dernière mise à jour : avril 2026
        </p>

        <div className="bg-panel border border-border rounded-lg p-6 space-y-6 text-ink text-sm leading-relaxed">
          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              À quoi servent les votes ?
            </h2>
            <p>
              Sur les fiches de généraux entraînables, nous affichons un mini
              sondage communautaire permettant aux joueurs d'indiquer quelle
              compétence ils préfèrent sur chaque slot reconfigurable. Le but
              est de donner un aperçu du meta actuel, en complément de notre
              recommandation éditoriale.
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              Quelles données sont collectées ?
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Un <b>cookie technique</b> déposé lors du vote
                (<code className="text-gold2">wc4_vote_&lt;general&gt;_&lt;slot&gt;</code>),
                conservé 30 jours, qui empêche de voter deux fois pour le même
                slot.
              </li>
              <li>
                Un <b>jeton Cloudflare Turnstile</b> temporaire, vérifié
                côté serveur puis jeté immédiatement — aucune donnée persistante
                n'est stockée par Cloudflare liée à votre identité.
              </li>
              <li>
                Un <b>compteur agrégé</b> par compétence, sans lien avec votre
                navigateur ni votre IP.
              </li>
            </ul>
            <p className="mt-2">
              Nous ne stockons <b>ni IP, ni empreinte de navigateur, ni compte
              utilisateur</b>. Il n'y a pas non plus de cookie publicitaire ou
              de traceur tiers lié à cette fonctionnalité.
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              Pourquoi un cookie sans bandeau de consentement ?
            </h2>
            <p>
              Le cookie <code className="text-gold2">wc4_vote_*</code> est un{" "}
              <b>cookie fonctionnel strictement nécessaire</b> au bon
              fonctionnement du service de vote (il empêche les votes en
              double). À ce titre, il est dispensé de recueil de consentement
              préalable selon l'article 82 de la loi Informatique et Libertés
              et les recommandations de la CNIL.
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              Durée de validité d'un vote
            </h2>
            <p>
              Un vote est valable <b>30 jours glissants</b>. Passé ce délai,
              vous pouvez revoter (le meta évolue avec les patchs et les modes
              de jeu).
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              Garde-fous anti-abus
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Cloudflare Turnstile</b> : vérification anti-bot sans
                friction, respectueuse de la vie privée.
              </li>
              <li>
                <b>Whitelist serveur</b> : seuls les identifiants de compétences
                officiellement proposés pour un slot donné sont acceptés.
              </li>
              <li>
                <b>Modération éditoriale</b> : en cas de vote massif anormal
                (campagne coordonnée, raid), nous nous réservons le droit
                d'invalider les votes concernés.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              Vos droits
            </h2>
            <p>
              Comme aucune donnée personnelle n'est associée à votre vote, il
              n'y a rien à supprimer individuellement. Vous pouvez effacer le
              cookie <code className="text-gold2">wc4_vote_*</code> depuis les
              paramètres de votre navigateur pour vous &laquo; déverrouiller
              &raquo; avant la fin des 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              Contact
            </h2>
            <p>
              Pour toute question liée à cette fonctionnalité, utilisez le
              formulaire de contact du site.
            </p>
          </section>
        </div>

        <div className="mt-6">
          <Link
            href="/world-conqueror-4/generaux"
            className="text-gold2 text-xs uppercase tracking-widest hover:underline"
          >
            ← Retour aux généraux
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
