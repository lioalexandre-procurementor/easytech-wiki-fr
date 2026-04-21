export type NavItem = {
  href: string;
  label: string;
  disabled?: boolean;
};

type T = (key: string) => string;

export function getNavItemsForGame(gameSlug: string | null, t: T): NavItem[] {
  switch (gameSlug) {
    case "world-conqueror-4":
      return [
        { href: "/world-conqueror-4", label: t("nav.wc4Home") },
        { href: "/world-conqueror-4/guides", label: t("nav.guides") },
        { href: "/world-conqueror-4/unites-elite", label: t("nav.eliteUnits") },
        { href: "/world-conqueror-4/empire-du-scorpion", label: t("nav.scorpion") },
        { href: "/world-conqueror-4/generaux", label: t("nav.generals") },
        { href: "/world-conqueror-4/tier-list", label: "Tier List" },
        { href: "/world-conqueror-4/competences", label: t("nav.skills") },
        { href: "/world-conqueror-4/technologies", label: t("nav.technologies") },
        { href: "/leaderboards", label: t("nav.leaderboards") },
      ];
    case "great-conqueror-rome":
      return [
        { href: "/great-conqueror-rome", label: t("nav.gcrHome") },
        { href: "/great-conqueror-rome/guides", label: t("nav.guides") },
        { href: "/great-conqueror-rome/unites-elite", label: t("nav.eliteUnits") },
        { href: "/great-conqueror-rome/conquete-romaine", label: t("nav.gcrCampaign") },
        { href: "/great-conqueror-rome/generaux", label: t("nav.generals") },
        { href: "/great-conqueror-rome/competences", label: t("nav.skills") },
        { href: "/great-conqueror-rome/technologies", label: t("nav.technologies") },
        { href: "/leaderboards", label: t("nav.leaderboards") },
      ];
    case "european-war-6":
      return [
        { href: "/european-war-6", label: t("nav.ew6Home") },
        { href: "/european-war-6/guides", label: t("nav.guides") },
        { href: "/european-war-6/unites-elite", label: t("nav.eliteUnits") },
        { href: "/european-war-6/generaux", label: t("nav.generals") },
        { href: "/european-war-6/competences", label: t("nav.skills") },
        { href: "/european-war-6/technologies", label: t("nav.technologies") },
        { href: "/leaderboards", label: t("nav.leaderboards") },
      ];
    default:
      return [
        { href: "/leaderboards", label: t("nav.leaderboards") },
        { href: "/world-conqueror-4/guides", label: t("nav.guides") },
        { href: "/world-conqueror-4/mises-a-jour", label: t("nav.updates") },
      ];
  }
}
