const aboutParagraphs = [
  <>
    We are Passionate Artists and Designers who create Handmade Candles with Love,
    Intention, and Care. Each candle Tells a Story and its Fragrance Speaks to Your
    Soul, designed to make you feel the same joy and warmth we felt while making it.
  </>,
  <>
    We don&apos;t just make candles for business, we make them to Lift Moods, Inspire
    Moments, and Bring Meaningful Gifts to life. Explore our Gallery and find a candle
    that Resonates with Your Heart, helping you Say What Words Cannot.
  </>,
];

const visualPanels = [
  {
    className:
      "absolute left-0 top-[1.8%] h-[44.78%] w-[24.69%] rounded-[12px] bg-[#A6A6A6]",
    ariaLabel: "Decorative top visual block",
  },
  {
    className:
      "absolute left-0 top-[55.74%] h-[44.26%] w-[24.68%] rounded-[12px] bg-[#A6A6A6]",
    ariaLabel: "Decorative bottom visual block",
  },
  {
    className:
      "absolute right-0 top-0 h-[82.51%] w-[54.8%] rounded-[16px] bg-[#DCDCDC]",
    ariaLabel: "Decorative background visual block",
  },
  {
    className:
      "absolute left-[26.15%] top-[12.91%] h-[87.01%] w-[69.64%] rounded-[16px] bg-[#A6A6A6]",
    ariaLabel: "Decorative foreground visual block",
  },
];

function AboutUs() {
  return (
    <div className="bg-white">
      <section className="py-8 sm:py-10 lg:py-12">
        <div className="relative mx-auto w-full max-w-[1260px] px-3 sm:px-4 lg:px-5">
          <h1 className="mx-auto w-full text-center font-display text-[clamp(2.1rem,3.1vw,3.5rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[#242424] md:whitespace-nowrap">
            Who We Are{" "}
            <span className="font-sans font-medium text-black">
              &amp;
            </span>{" "}
            What We Do
          </h1>

          <div className="mx-auto mt-4 h-px w-[min(240px,32vw)] bg-[linear-gradient(90deg,rgba(216,195,162,0)_0%,rgba(216,195,162,0.9)_50%,rgba(216,195,162,0)_100%)]" />

          <div className="balanced-split-layout mt-6 grid gap-6 sm:mt-7 sm:gap-7 lg:mt-8 lg:grid-cols-[minmax(0,392px)_minmax(480px,592px)] lg:justify-center lg:gap-[42px]">
            <div className="max-w-[392px]">
              <div className="space-y-5 text-[14.5px] leading-[1.72] text-[#646464] sm:text-[15px]">
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="balanced-split-media mx-auto w-full max-w-[592px]">
              <div className="balanced-split-frame relative aspect-[628/418] lg:aspect-auto lg:min-h-[420px]">
                {visualPanels.map((panel) => (
                  <div
                    key={panel.ariaLabel}
                    aria-hidden="true"
                    className={panel.className}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
