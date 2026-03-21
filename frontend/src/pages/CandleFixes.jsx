import { useEffect, useState } from "react";
import StatusView from "../components/StatusView";
import { contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

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
          setFixes(response);
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

  return (
    <section className="container-shell space-y-8 py-10">
      <div>
        <p className="eyebrow">Candle fixes</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
          Practical fixes for wick, wax, and burn issues.
        </h1>
      </div>

      {isLoading ? (
        <StatusView title="Loading candle fixes" message="Fetching care and troubleshooting content." />
      ) : error ? (
        <StatusView title="Candle fixes unavailable" message={error} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {fixes.map((fix) => (
            <article key={fix.id} className="panel overflow-hidden">
              <div className="grid gap-6 p-6 sm:grid-cols-[1fr_1fr]">
                <div className="space-y-4">
                  <p className="eyebrow">Cause</p>
                  <h2 className="font-display text-3xl font-semibold text-brand-dark">
                    {fix.title}
                  </h2>
                  <p className="text-sm leading-7 text-brand-dark/70">{fix.cause}</p>
                  <a
                    href={fix.videoUrl || "#"}
                    className="inline-flex rounded-full bg-brand-dark px-4 py-3 text-sm font-semibold text-white"
                  >
                    Watch Video Tutorial
                  </a>
                </div>
                <div className="space-y-4 rounded-[24px] bg-brand-secondary p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">
                    Fix steps
                  </p>
                  <div className="whitespace-pre-line text-sm leading-8 text-brand-dark/80">
                    {fix.fixSteps}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default CandleFixes;
