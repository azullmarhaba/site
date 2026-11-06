export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function websiteJsonLd(input: {
  url: string;
  name: string;
  description: string;
  locales: readonly string[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    description: input.description,
    inLanguage: input.locales,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${input.url}/experiences?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd(input: {
  url: string;
  name: string;
  descriptor: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  sameAs: string[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: input.name,
    alternateName: input.descriptor,
    description: input.description,
    url: input.url,
    email: input.email,
    telephone: input.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address,
      addressLocality: "Marrakech",
      addressCountry: "MA",
    },
    areaServed: { "@type": "Country", name: "Morocco" },
    sameAs: input.sameAs,
  };
}

export function experienceJsonLd(input: {
  url: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  ratingAvg: number;
  ratingCount: number;
  durationISO8601?: string;
  image?: string;
}): Record<string, unknown> | null {
  if (!input.ratingCount) return null;
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.durationISO8601 ? { duration: input.durationISO8601 } : {}),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: input.ratingAvg,
      reviewCount: input.ratingCount,
      bestRating: 5,
      worstRating: 1,
    },
    offers: {
      "@type": "Offer",
      price: input.priceMinor / 100,
      priceCurrency: input.currency,
      availability: "https://schema.org/InStock",
      url: input.url,
    },
  };
}

export function blogPostJsonLd(input: {
  url: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  author: string;
  image?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { "@type": "Organization", name: input.author },
    ...(input.image ? { image: input.image } : {}),
  };
}

export function JsonLdSlot({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return <JsonLd data={data} />;
}
