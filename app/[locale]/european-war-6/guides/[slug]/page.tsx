import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [];
}

export function generateMetadata(): Metadata {
  return { title: "Not found", robots: { index: false, follow: false } };
}

export default function Page(): never {
  notFound();
}
