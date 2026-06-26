/**
 * Renders a schema.org JSON-LD <script>. Server-rendered so crawlers see the
 * structured data in the initial HTML. `data` is serialized as-is.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be inline
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
