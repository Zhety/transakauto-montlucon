/**
 * Données structurées schema.org. `<` est échappé : un texte contenant
 * « </script> » ne peut pas fermer la balise prématurément.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
