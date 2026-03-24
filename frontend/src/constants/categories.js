export const CANONICAL_CATEGORIES = [
  { slug: "", name: "All", footerLabel: "All", to: "/shop" },
  { slug: "candle-sets", name: "Candle Sets", footerLabel: "Sets", to: "/shop?category=candle-sets" },
  { slug: "glass", name: "Glass", footerLabel: "Glass", to: "/shop?category=glass" },
  { slug: "tea-light", name: "Tealights", footerLabel: "Tealights", to: "/shop?category=tea-light" },
  { slug: "flower", name: "Flowers", footerLabel: "Flowers", to: "/shop?category=flower" },
  { slug: "creation", name: "CandleOra Creations", footerLabel: "CandleOra Creations", to: "/shop?category=creation" },
];

export const FILTERABLE_CATEGORIES = CANONICAL_CATEGORIES;

export function getCategoryBySlug(slug) {
  return CANONICAL_CATEGORIES.find((category) => category.slug === slug) ?? CANONICAL_CATEGORIES[0];
}
