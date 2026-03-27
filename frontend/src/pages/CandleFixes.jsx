import { useEffect, useState } from "react";
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

function CandleFixSection({ fix }) {
  const steps = parseFixSteps(fix.fixSteps);

  return (
    <article className="grid gap-5 border-b border-black/8 pb-7 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start lg:gap-8">
      <div className="space-y-2 text-left">
        <h2 className="font-display text-heading-sm font-semibold leading-tight text-black">
          {fix.title}
        </h2>

        <p className="text-sm font-semibold leading-6 text-danger">Cause: {fix.cause}</p>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-black">Fix:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-black/72">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:max-w-[540px]">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`${fix.id}-image-${index + 1}`}
            className="aspect-[1/0.9] rounded-[10px] bg-[#b8b8b8]"
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

  if (isLoading) {
    return (
      <section className="container-shell py-12 sm:py-16">
        <StatusView
          title="Loading candle fixes"
          message="Fetching CandleOra care and troubleshooting content."
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="container-shell py-12 sm:py-16">
        <StatusView title="Candle fixes unavailable" message={error} />
      </section>
    );
  }

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="w-full">
        <header className="max-w-[760px]">
          <h1 className="font-display text-heading-lg font-semibold text-black">CANDLE FIXES</h1>
          <p className="mt-4 text-sm leading-7 text-black/62">
            For every candle question, there&apos;s a CandleOra solution - your trusted guide to keep the glow alive.
          </p>
        </header>

        <div className="mt-8 space-y-7 sm:mt-9 sm:space-y-8">
          {fixes.map((fix) => (
            <CandleFixSection key={fix.id} fix={fix} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CandleFixes;
