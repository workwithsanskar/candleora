import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusView from "../components/StatusView";
import { contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

function StylingGuideDetail() {
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    contentApi
      .getGuides()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const selectedGuide = response.find((item) => item.slug === slug);
        setGuide(selectedGuide ?? null);
        if (!selectedGuide) {
          setError("The requested styling guide was not found.");
        }
      })
      .catch((guideError) => {
        if (isMounted) {
          setError(formatApiError(guideError));
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
  }, [slug]);

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Loading guide" message="Fetching the styling guide details." />
      </section>
    );
  }

  if (!guide) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Guide unavailable"
          message={error}
          action={
            <Link
              to="/styling-guides"
              className="mt-6 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Back to guides
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="container-shell space-y-8 py-10">
      <img
        src={guide.imageUrl}
        alt={guide.title}
        className="panel aspect-[16/7] w-full object-cover"
      />
      <article className="panel p-6 sm:p-8">
        <p className="eyebrow">Step-by-step</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
          {guide.title}
        </h1>
        <p className="mt-5 text-sm leading-7 text-brand-dark/70">{guide.description}</p>
        <div className="mt-8 whitespace-pre-line text-sm leading-8 text-brand-dark/80">
          {guide.detailedContent}
        </div>
      </article>
    </section>
  );
}

export default StylingGuideDetail;
