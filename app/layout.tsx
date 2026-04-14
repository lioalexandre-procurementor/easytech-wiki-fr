import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyTech Wiki FR — World Conqueror, European War & plus",
  description: "Le wiki francophone de référence pour les jeux de stratégie EasyTech : World Conqueror 4, European War 6/7, Great Conqueror Rome. Stats détaillées des unités d'élite, généraux, technologies et guides.",
  keywords: ["world conqueror 4", "wc4", "easytech", "wiki", "français", "unités d'élite", "généraux", "stratégie", "european war"],
  authors: [{ name: "EasyTech Wiki FR" }],
  openGraph: {
    title: "EasyTech Wiki FR",
    description: "Le wiki francophone des jeux EasyTech",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
