export type NavItem = {
  href: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  primary?: boolean;
};

type T = (key: string) => string;

export function getNavItemsForGame(gameSlug: string | null, t: T): NavItem[] {
  switch (gameSlug) {
    case "world-conqueror-4":
      return [
        { href: "/world-conqueror-4", label: t("nav.wc4Home"), primary: true },
        { href: "/world-conqueror-4/generaux", label: t("nav.generals"), primary: true },
        { href: "/world-conqueror-4/unites-elite", label: t("nav.eliteUnits"), primary: true },
        { href: "/leaderboards", label: t("nav.leaderboards"), primary: true },
        { href: "/world-conqueror-4/guides", label: t("nav.guides"), primary: true },
        { href: "/world-conqueror-4/tier-list", label: "Tier List", icon: "🏆" },
        { href: "/world-conqueror-4/competences", label: t("nav.skills"), icon: "⚡" },
        { href: "/world-conqueror-4/technologies", label: t("nav.technologies"), icon: "🔬" },
        { href: "/world-conqueror-4/comparateur/generaux", label: t("nav.comparator"), icon: "⚖️" },
        { href: "/world-conqueror-4/empire-du-scorpion", label: t("nav.scorpion"), icon: "🦂" },
      ];
    case "great-conqueror-rome":
      return [
        { href: "/great-conqueror-rome", label: t("nav.gcrHome"), primary: true },
        { href: "/great-conqueror-rome/generaux", label: t("nav.generals"), primary: true },
        { href: "/great-conqueror-rome/unites-elite", label: t("nav.eliteUnits"), primary: true },
        { href: "/leaderboards", label: t("nav.leaderboards"), primary: true },
        { href: "/great-conqueror-rome/guides", label: t("nav.guides"), primary: true },
        { href: "/great-conqueror-rome/competences", label: t("nav.skills"), icon: "⚡" },
        { href: "/great-conqueror-rome/technologies", label: t("nav.technologies"), icon: "🔬" },
        { href: "/great-conqueror-rome/comparateur/generaux", label: t("nav.comparator"), icon: "⚖️" },
        { href: "/great-conqueror-rome/conquete-romaine", label: t("nav.gcrCampaign"), icon: "🏛" },
      ];
    case "european-war-6":
      return [
        { href: "/european-war-6", label: t("nav.ew6Home"), primary: true },
        { href: "/european-war-6/generaux", label: t("nav.generals"), primary: true },
        { href: "/european-war-6/unites-elite", label: t("nav.eliteUnits"), primary: true },
        { href: "/leaderboards", label: t("nav.leaderboards"), primary: true },
        { href: "/european-war-6/guides", label: t("nav.guides"), primary: true },
        { href: "/european-war-6/competences", label: t("nav.skills"), icon: "⚡" },
        { href: "/european-war-6/technologies", label: t("nav.technologies"), icon: "🔬" },
        { href: "/european-war-6/comparateur/generaux", label: t("nav.comparator"), icon: "⚖️" },
      ];
    default:
      return [
        { href: "/leaderboards", label: t("nav.leaderboards"), primary: true },
        { href: "/world-conqueror-4/guides", label: t("nav.guides"), icon: "📘" },
        { href: "/world-conqueror-4/mises-a-jour", label: t("nav.updates"), icon: "📣" },
      ];
  }
}
