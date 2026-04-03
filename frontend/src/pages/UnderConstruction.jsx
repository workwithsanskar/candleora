import { Link, useParams } from "react-router-dom";
import candleFixesCard from "../assets/designer/candle-fixes-card.png";
import bookshelfImage from "../assets/designer/bookshelf-floral.png";
import stylingGuideCard from "../assets/designer/styling-guides-card.png";

const featureContent = {
  "styling-guides": {
    title: "Styling Guides",
    image: stylingGuideCard,
    description:
      "We are refining this experience so it returns with richer inspiration, cleaner layouts, and a smoother browsing flow.",
  },
  "occasion-picks": {
    title: "Occasion Picks",
    image: bookshelfImage,
    description:
      "This feature is being refreshed so your gifting and celebration ideas feel more curated and easier to explore.",
  },
  "candle-fixes": {
    title: "Candle Fixes",
    image: candleFixesCard,
    description:
      "We are polishing this guide so every candle-care fix feels clearer, faster to scan, and more helpful to follow.",
  },
};

function UnderConstruction() {
  const { featureSlug } = useParams();
  const feature = featureContent[featureSlug] ?? {
    title: "This Page",
    image: stylingGuideCard,
    description:
      "We are polishing this part of CandleOra and it will be available again soon.",
  };

  return (
    <section className="container-shell py-12 sm:py-16 lg:py-20">
      <div className="balanced-split-layout grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="balanced-split-media relative overflow-hidden rounded-[24px] bg-black shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
          <img
            src={feature.image}
            alt={feature.title}
            className="balanced-split-visual min-h-[320px] sm:min-h-[420px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[rgba(255,255,255,0.28)] px-6 py-4 backdrop-blur-[2px]">
            <p className="text-center text-[1.15rem] font-semibold uppercase tracking-[0.06em] text-black sm:text-[1.35rem]">
              {feature.title}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-black/10 bg-[#f8ecd7] px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-black/82">
            Coming Soon
          </span>

          <div className="space-y-4">
            <h1 className="page-title">We&apos;re refining {feature.title}</h1>
            <p className="page-subtitle max-w-[560px]">{feature.description}</p>
            <p className="text-sm leading-7 text-black/65">
              The homepage card will stay live, and this page will open as soon as the
              updated experience is ready.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link to="/" className="btn btn-primary">
              Back Home
            </Link>
            <Link to="/shop" className="btn btn-secondary">
              Browse The Shop
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UnderConstruction;
