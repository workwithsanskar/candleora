import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusView from "../components/StatusView";
import { contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

const pageSize = 9;

const placeholderGuides = [
  {
    id: "placeholder-1",
    title: "Shelf Styling Balance",
    description: "Placeholder styling concept for layered shelves and soft objects.",
  },
  {
    id: "placeholder-2",
    title: "Console Accent Glow",
    description: "Placeholder styling concept for entry console arrangements.",
  },
  {
    id: "placeholder-3",
    title: "Reading Nook Warmth",
    description: "Placeholder styling concept for lamps, books, and candle corners.",
  },
  {
    id: "placeholder-4",
    title: "Coffee Table Layering",
    description: "Placeholder styling concept for compact table candle layouts.",
  },
  {
    id: "placeholder-5",
    title: "Minimal Mantel Glow",
    description: "Placeholder styling concept for clean fireplace styling.",
  },
  {
    id: "placeholder-6",
    title: "Bedside Ritual Setup",
    description: "Placeholder styling concept for calm bedside candle placement.",
  },
  {
    id: "placeholder-7",
    title: "Festive Corner Styling",
    description: "Placeholder styling concept for celebratory home arrangements.",
  },
  {
    id: "placeholder-8",
    title: "Gift Table Presentation",
    description: "Placeholder styling concept for gifting and wrapping displays.",
  },
  {
    id: "placeholder-9",
    title: "Spa Bathroom Candle Scene",
    description: "Placeholder styling concept for wellness-inspired corners.",
  },
];

const sidebarCategories = [
  { label: "Occasion Picks", to: "/occasion-picks", active: false },
  { label: "Styling Guides", to: "/styling-guides", active: true },
  { label: "Sets" },
  { label: "Glass" },
  { label: "Holders" },
  { label: "Tea Lights" },
  { label: "Textured" },
];

const staticFilters = [
  "Guide Styling",
  "Room Corners",
  "Table Styling",
  "Gift Setup",
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L21 21" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 10L12 15L17 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GuidePlaceholderCard({ guide }) {
  const cardContent = (
    <article className="space-y-3">
      <div className="relative overflow-hidden rounded-[10px] bg-[#bcbcbc]">
        <div className="aspect-[0.78] w-full" />
        <span className="absolute left-2 top-2 rounded-full bg-[#414141] px-2 py-1 text-[9px] font-semibold uppercase leading-none text-white">
          Guide
        </span>
      </div>

      <div className="space-y-2 text-center">
        <h3 className="truncate text-[15px] text-brand-dark">{guide.title}</h3>
        <p className="min-h-[2.8rem] text-[13px] leading-6 text-brand-dark/62">
          {guide.description}
        </p>
      </div>

      <div className="flex justify-center">
        {guide.slug ? (
          <span className="inline-flex w-full items-center justify-center rounded-[4px] bg-[#f2b84b] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition group-hover:bg-[#ddaa44]">
            Read Guide
          </span>
        ) : (
          <span className="inline-flex w-full items-center justify-center rounded-[4px] bg-[#bcbcbc] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            Coming Soon
          </span>
        )}
      </div>
    </article>
  );

  if (!guide.slug) {
    return cardContent;
  }

  return (
    <Link to={`/styling-guides/${guide.slug}`} className="group block">
      {cardContent}
    </Link>
  );
}

function FilterSection({ title, children }) {
  return (
    <section className="border border-[#dddddd] bg-white px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-6 w-[2px] bg-black" />
        <h2 className="text-[1.1rem] font-medium text-brand-dark">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StylingGuides() {
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let isMounted = true;

    contentApi
      .getGuides()
      .then((response) => {
        if (isMounted) {
          setGuides(response);
        }
      })
      .catch((guidesError) => {
        if (isMounted) {
          setError(formatApiError(guidesError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch]);

  const displayGuides = useMemo(() => {
    const normalizedGuides = Array.isArray(guides) ? [...guides] : [];

    while (normalizedGuides.length < 12) {
      const placeholderIndex =
        (normalizedGuides.length - guides.length) % placeholderGuides.length;
      normalizedGuides.push(placeholderGuides[placeholderIndex]);
    }

    const filteredGuides = normalizedGuides.filter((guide) => {
      const haystack = `${guide.title ?? ""} ${guide.description ?? ""}`.toLowerCase();
      return haystack.includes(deferredSearch.toLowerCase());
    });

    return filteredGuides;
  }, [guides, deferredSearch]);

  const visibleGuides = displayGuides.slice(0, (page + 1) * pageSize);
  const hasMorePages = visibleGuides.length < displayGuides.length;
  const showingFrom = visibleGuides.length > 0 ? 1 : 0;
  const showingTo = visibleGuides.length;

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[180px_1fr] xl:grid-cols-[200px_1fr]">
        <aside className="space-y-4">
          <FilterSection title="Categories">
            <div className="space-y-3 text-[14px] text-brand-dark/82">
              {sidebarCategories.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`block transition ${
                      item.active
                        ? "font-medium text-[#f0a31c] underline underline-offset-4"
                        : "hover:text-brand-dark"
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center justify-between text-left transition hover:text-brand-dark"
                  >
                    <span>{item.label}</span>
                    <ChevronIcon />
                  </button>
                ),
              )}
            </div>
          </FilterSection>

          <FilterSection title="Guide Themes">
            <div className="space-y-3">
              {staticFilters.map((item, index) => (
                <label
                  key={item}
                  className="flex items-center gap-3 text-[13px] text-brand-dark/82"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={index === 0}
                    className="h-3.5 w-3.5 accent-brand-dark"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        </aside>

        <div className="space-y-6">
          <div className="space-y-5">
            <h1 className="text-[2.7rem] font-semibold tracking-[-0.04em] text-brand-dark">
              STYLING GUIDES
            </h1>

            <label className="flex items-center gap-3 rounded-full border border-[#d9d9d9] px-5 py-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search An Item"
                className="w-full bg-transparent text-[14px] text-brand-dark outline-none placeholder:text-brand-dark/35"
              />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5f5a55] text-white">
                <SearchIcon />
              </span>
            </label>

            <p className="text-[13px] text-brand-dark/76">
              Showing {showingFrom}-{showingTo} of {displayGuides.length} item(s)
            </p>
          </div>

          {isLoading ? (
            <StatusView
              title="Loading styling guides"
              message="Pulling the latest guide content."
            />
          ) : error ? (
            <StatusView title="Styling guides unavailable" message={error} />
          ) : visibleGuides.length === 0 ? (
            <StatusView
              title="No styling guides match that search"
              message="Try another keyword to browse the guide library."
            />
          ) : (
            <>
              <div className="grid gap-x-4 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
                {visibleGuides.map((guide, index) => (
                  <GuidePlaceholderCard
                    key={guide.id ?? `${guide.title}-${index}`}
                    guide={guide}
                  />
                ))}
              </div>

              {hasMorePages && (
                <div className="pt-8 text-center">
                  <p className="text-[13px] text-brand-dark/76">
                    Showing {showingFrom}-{showingTo} of {displayGuides.length} item(s)
                  </p>
                  <div className="mx-auto mt-4 h-px w-full max-w-[420px] bg-[#d5d5d5]" />
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2a2a2a] px-7 py-3 text-[15px] font-medium text-white transition hover:bg-black"
                  >
                    Load More
                    <span className="text-lg leading-none">{">"}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default StylingGuides;
