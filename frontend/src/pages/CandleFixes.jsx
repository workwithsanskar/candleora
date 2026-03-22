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

function FixPlaceholderGallery() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          data-testid="fix-placeholder"
          className={`h-[180px] rounded-[16px] bg-[#bcbcbc] sm:h-[200px] lg:h-[220px] ${
            index === 2 ? "col-span-full sm:col-auto" : ""
          }`}
        />
      ))}
    </div>
  );
}

function CandleFixSection({ fix }) {
  const steps = parseFixSteps(fix.fixSteps);

  return (
    <article className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
      <div className="max-w-[480px] space-y-4">
        <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-brand-dark sm:text-[2.2rem]">
          {fix.title}
        </h2>

        <p className="text-[1rem] font-semibold leading-7 text-[#d43737]">
          Cause: {fix.cause}
        </p>

        <div className="pt-2">
          <p className="text-[1rem] font-medium text-brand-dark">Fix:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-[1rem] leading-8 text-brand-dark/72">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      <FixPlaceholderGallery />
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
    <div className="bg-white">
      <section className="container-shell py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1240px]">
          <header className="max-w-[840px]">
            <h1 className="text-[2.6rem] font-semibold tracking-[-0.04em] text-brand-dark sm:text-[3.1rem]">
              CANDLE FIXES
            </h1>
            <p className="mt-4 text-[1rem] leading-8 text-brand-dark/55 sm:text-[1.05rem]">
              For every candle question, there&apos;s a CandleOra solution - your trusted guide to
              keep the glow alive.
            </p>
          </header>

          <div className="mt-14 space-y-20 sm:mt-16 sm:space-y-24 lg:mt-20 lg:space-y-28">
            {fixes.map((fix) => (
              <CandleFixSection key={fix.id} fix={fix} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default CandleFixes;
