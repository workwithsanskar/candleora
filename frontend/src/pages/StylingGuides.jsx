import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusView from "../components/StatusView";
import { contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

function StylingGuides() {
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <section className="container-shell space-y-8 py-10">
      <div>
        <p className="eyebrow">Styling guides</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
          Simple ideas to make candles part of the room.
        </h1>
      </div>

      {isLoading ? (
        <StatusView title="Loading styling guides" message="Pulling the latest guide content." />
      ) : error ? (
        <StatusView title="Styling guides unavailable" message={error} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide) => (
            <Link key={guide.id} to={`/styling-guides/${guide.slug}`} className="panel overflow-hidden">
              <img
                src={guide.imageUrl}
                alt={guide.title}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="space-y-3 p-5">
                <p className="eyebrow">Guide</p>
                <h2 className="font-display text-3xl font-semibold text-brand-dark">
                  {guide.title}
                </h2>
                <p className="text-sm leading-7 text-brand-dark/70">{guide.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default StylingGuides;
