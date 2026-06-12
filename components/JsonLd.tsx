interface Props {
  data: Record<string, unknown> | null | undefined;
}

export function JsonLd({ data }: Props) {
  // Tolerate null so callers can pass a schema builder that may opt out
  // (e.g. gameSchema returns null for an unknown game) without a guard.
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
