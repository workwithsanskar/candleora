function AboutUs() {
  return (
    <div className="bg-white">
      <section className="container-shell py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-[1220px]">
          <h1 className="page-title text-center tracking-[-0.04em]">
            Who We Are &amp; What We Do
          </h1>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
            <div className="max-w-[560px] space-y-6 text-base leading-8 text-brand-dark/72">
              <p>
                We are passionate <span className="font-semibold text-brand-dark">artists and designers</span> who think about
                innovation and possibilities, and also think about your needs and mood. Here, we bring{" "}
                <span className="font-semibold text-brand-dark">handmade candles</span> for you, where each candle tells a story
                and every fragrance has something to say to your soul. We make every candle design with
                something in mind. Our mission is that you feel the same as we felt while making it, and
                we care for you.
              </p>

              <p>
                We personally love candles and know their divinity and power. We started this business not
                to make profits, but to give you what you want and we believe a candle is the{" "}
                <span className="font-semibold text-brand-dark">best way to lift any mood</span>. It is, in our opinion, the
                best gift to bring change in an individual&apos;s life.
              </p>

              <p>
                Explore our gallery; we believe{" "}
                <span className="font-semibold text-brand-dark">you will definitely find something that relates to your situation</span>{" "}
                and inspires you to bring it home.{" "}
                <span className="font-semibold text-brand-dark">
                  Sometimes, things like candles are the best way to say what you cannot express to others
                </span>{" "}
                and share what you truly want to say.
              </p>
            </div>

            <div className="relative min-h-[430px] lg:min-h-[520px]">
              <div className="absolute right-0 top-6 hidden h-[340px] w-[58%] rounded-[12px] bg-[#ececec] lg:block" />

              <div className="grid h-full gap-5 sm:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] lg:gap-6">
                <div className="flex flex-col gap-5 lg:gap-6">
                  <div className="h-[180px] rounded-[18px] bg-[#bcbcbc] sm:h-[210px] lg:h-[224px]" />
                  <div className="h-[180px] rounded-[18px] bg-[#bcbcbc] sm:h-[210px] lg:h-[224px]" />
                </div>

                <div className="relative">
                  <div className="h-[290px] rounded-[22px] bg-[#b8b8b8] sm:h-[440px] lg:mt-[54px] lg:h-[392px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
