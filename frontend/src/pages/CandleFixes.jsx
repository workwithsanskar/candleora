import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Skeleton from "../components/Skeleton";
import StatusView from "../components/StatusView";
import { contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

const canonicalFixes = [
  {
    id: "candle-stops-burning-in-the-middle",
    title: "Candle Stops Burning in the Middle",
    cause: "Wick might be buried in wax or too short.",
    fixSteps:
      "1. Extinguish the candle and let it cool completely.\n2. Use a spoon or wick tool to gently remove a small amount of wax around the wick.\n3. Trim the wick to about 1/4 inch and relight.",
    matchers: [/candle stops burning in the middle/i],
  },
  {
    id: "uneven-burning-or-tunneling",
    title: "Uneven Burning or Tunneling",
    cause: "Wick not centered or not burning long enough on the first use.",
    fixSteps:
      "1. On the next burn, allow the wax to melt all the way to the edges.\n2. If tunneling is already there, use a foil wrap around the candle's rim to help even it out.",
    matchers: [/uneven burning/i, /tunneling/i],
  },
  {
    id: "low-flame-or-weak-scent-throw",
    title: "Low Flame or Weak Scent Throw",
    cause: "Wick trimmed too short or fragrance not dispersing.",
    fixSteps:
      "1. Gently pour out a little melted wax or scoop it with a spoon.\n2. Relight to let the wick breathe and flame grow.",
    matchers: [/low flame/i, /weak scent throw/i],
  },
  {
    id: "mushrooming-wick",
    title: "Mushrooming Wick",
    cause: "Wick is too long or has carbon build-up.",
    fixSteps: "1. Extinguish the candle.\n2. Trim the mushroomed tip before relighting.",
    matchers: [/mushrooming wick/i, /smoking wick/i, /soot buildup/i],
  },
];

function parseFixSteps(fixSteps) {
  return String(fixSteps ?? "")
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step) => step.replace(/^\d+\.\s*/, "").trim());
}

function normalizeFixes(rawFixes) {
  const fixes = Array.isArray(rawFixes) ? [...rawFixes] : [];

  return canonicalFixes.map((canonicalFix) => {
    const matchedFix = fixes.find((fix) =>
      canonicalFix.matchers.some((matcher) => matcher.test(String(fix?.title ?? ""))),
    );

    return {
      id: matchedFix?.id ?? canonicalFix.id,
      title: canonicalFix.title,
      cause: canonicalFix.cause,
      fixSteps: canonicalFix.fixSteps,
    };
  });
}

function CandleFixSkeleton() {
  return (
    <article className="grid gap-6 lg:grid-cols-[340px_685px] lg:items-start lg:gap-x-12">
      <div className="min-w-0 max-w-[340px] space-y-4 text-left">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[80%] rounded-md"></Skeleton>
          <Skeleton className="h-8 w-[60%] rounded-md"></Skeleton>
        </div>
        
        <Skeleton className="mt-4 h-4 w-full rounded-md"></Skeleton>

        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-[25%] rounded-md"></Skeleton>
          <ul className="space-y-3 pl-5 pt-1">
            <li><Skeleton className="h-3 w-full rounded-md"></Skeleton></li>
            <li><Skeleton className="h-3 w-[85%] rounded-md"></Skeleton></li>
            <li><Skeleton className="h-3 w-[70%] rounded-md"></Skeleton></li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 lg:w-[685px] lg:grid-cols-3 lg:justify-self-end lg:gap-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={`skeleton-image-${index}`}
            className="h-[180px] w-full rounded-[10px] sm:h-[200px] lg:h-[215px]"
          />
        ))}
      </div>
    </article>
  );
}

function CandleFixSection({ fix }) {
  const steps = parseFixSteps(fix.fixSteps);

  return (
    <article className="grid gap-6 lg:grid-cols-[340px_685px] lg:items-start lg:gap-x-12">
      <div className="min-w-0 max-w-[340px] space-y-2 text-left">
        <h2 className="max-w-[340px] font-display text-[1.5rem] font-semibold leading-[1.08] tracking-[-0.03em] text-brand-dark sm:text-[1.62rem]">
          {fix.title}
        </h2>

        <p className="text-[0.9rem] font-semibold leading-5 text-danger">Cause: {fix.cause}</p>

        <div className="space-y-2 pt-1.5">
          <p className="text-[0.95rem] font-semibold text-brand-dark">Fix:</p>
          <ul className="list-disc space-y-1 pl-5 text-[0.92rem] leading-7 text-brand-dark/70">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 lg:w-[685px] lg:grid-cols-3 lg:justify-self-end lg:gap-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`${fix.id}-image-${index + 1}`}
            className="h-[180px] w-full rounded-[10px] bg-brand-muted/15 sm:h-[200px] lg:h-[215px]"
            aria-hidden="true"
          />
        ))}
      </div>
    </article>
  );
}

function CandleFixes() {
  const [fixes, setFixes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    contentApi
      .getFixes()
      .then((response) => {
        if (isMounted) {
          setFixes(normalizeFixes(response));
        }
      })
      .catch((fixesError) => {
        if (isMounted) {
          setError(formatApiError(fixesError));
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

  if (error) {
    return (
      <section className="container-shell py-12 sm:py-16">
        <StatusView title="Candle fixes unavailable" message={error} />
      </section>
    );
  }

  return (
    <section className="container-shell py-10 sm:py-11">
      <div className="mx-auto w-full max-w-[1180px] overflow-hidden">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-dark transition"
        >
          <span aria-hidden="true">&lt;</span>
          <span className="transition group-hover:underline group-hover:underline-offset-4">Back</span>
        </Link>

        <header className="max-w-[820px]">
          <h1 className="mt-4 font-display text-heading-lg font-semibold text-brand-dark">Candle Fixes</h1>
          <p className="mt-3 text-[0.95rem] leading-6 text-brand-dark/60">
            For every candle question, there&apos;s a CandleOra solution - your trusted guide to keep the glow alive.
          </p>
        </header>

        <div className="mt-8 space-y-10 sm:mt-9 sm:space-y-12">
          {isLoading ? (
            <>
              <CandleFixSkeleton />
              <CandleFixSkeleton />
              <CandleFixSkeleton />
            </>
          ) : (
            fixes.map((fix) => (
              <CandleFixSection key={fix.id} fix={fix} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default CandleFixes;
