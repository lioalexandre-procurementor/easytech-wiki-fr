"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  items: FaqItem[];
  heading: string;
}

export function FaqAccordion({ items, heading }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section aria-label={heading} className="bg-panel border border-border rounded-lg p-5">
      <h2 className="text-gold2 font-bold text-lg mb-4">{heading}</h2>
      <dl className="divide-y divide-border">
        {items.map((item, i) => (
          <div key={i}>
            <dt>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-3 text-left text-dim text-sm font-semibold hover:text-gold2 cursor-pointer"
                aria-expanded={openIndex === i}
              >
                <span>{item.q}</span>
                <span className="ml-4 shrink-0 text-muted text-base leading-none">
                  {openIndex === i ? "−" : "+"}
                </span>
              </button>
            </dt>
            {openIndex === i && (
              <dd className="pb-4 text-dim text-sm leading-relaxed">{item.a}</dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
