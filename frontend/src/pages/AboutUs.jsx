const aboutParagraphs = [
  <>
    We are passionate <span className="font-semibold text-black">artists and designers</span> who
    create <span className="font-semibold text-black">handmade candles</span> for real moods,
    moments, and memories. Every piece is made with intention so its fragrance, form, and feeling
    speak to you in a personal way.
  </>,
  <>
    We love candles for the comfort and atmosphere they bring. To us, a candle is one of the{" "}
    <span className="font-semibold text-black">best ways to lift any mood</span> and turn a simple
    gift into something meaningful.
  </>,
  <>
    Explore our gallery and you will find something that fits your moment. We believe candles can{" "}
    <span className="font-semibold text-black">say what words sometimes cannot</span>, helping you
    share warmth, emotion, and intention beautifully.
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
          <div className="mx-auto flex max-w-max items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#977446]">
            <span className="h-px w-8 bg-[#d8c3a2]" />
            <span>CandleOra Story</span>
            <span className="h-px w-8 bg-[#d8c3a2]" />
          </div>

          <h1 className="mt-4 mx-auto w-full text-center font-display text-[clamp(2.1rem,3.1vw,3.5rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[#242424] md:whitespace-nowrap">
            Who We Are <span className="font-sans font-medium text-[#7c6748]">&amp;</span> What We Do
          </h1>

          <div className="mx-auto mt-4 h-px w-[min(240px,32vw)] bg-[linear-gradient(90deg,rgba(216,195,162,0)_0%,rgba(216,195,162,0.9)_50%,rgba(216,195,162,0)_100%)]" />

          <div className="mt-6 grid gap-6 sm:mt-7 sm:gap-7 lg:mt-8 lg:grid-cols-[minmax(0,392px)_minmax(480px,592px)] lg:items-center lg:justify-center lg:gap-[42px]">
            <div className="max-w-[392px]">
              <div className="mb-4 h-px w-20 bg-[#e6d8c2]" />
              <div className="space-y-4 text-[14.5px] leading-[1.58] text-[#646464] sm:text-[15px]">
              {aboutParagraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={index === 0 ? "text-[#5f5f5f]" : ""}
                >
                  {paragraph}
                </p>
              ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[592px]">
              <div className="relative aspect-[628/418]">
                {visualPanels.map((panel) => (
                  <div key={panel.ariaLabel} aria-hidden="true" className={panel.className} />
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
