function AboutUs() {
  return (
    <div className="bg-white">
      <section className="container-shell py-9 sm:py-11 lg:py-12">
        <div className="mx-auto max-w-[1320px]">
          <h1 className="text-center font-display text-[2.8rem] font-semibold leading-[0.94] tracking-[-0.045em] text-black sm:text-[3.45rem] lg:text-[4.2rem]">
            Who We Are &amp; What We Do
          </h1>

          <div className="mt-9 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-start lg:gap-14">
            <div className="max-w-[620px] space-y-8 text-[1.02rem] leading-[1.76] text-brand-dark/78">
              <p>
                We are passionate{" "}
                <span className="font-semibold text-brand-dark">artists and designers</span> who think about
                innovation and possibilities, and also think about your needs and mood. Here, we bring{" "}
                <span className="font-semibold text-brand-dark">handmade candles</span> for you, where each
                candle tells a story and every fragrance has something to say to your soul. We make
                every candle design with something in mind. Our mission is that you feel the same as
                we felt while making it, and we care for you.
              </p>

              <p>
                We personally love candles and know their divinity and power. We started this business
                not to make profits, but to give you what you want and we believe a candle is the{" "}
                <span className="font-semibold text-brand-dark">best way to lift any mood</span>. It is,
                in our opinion, the best gift to bring change in an individual&apos;s life.
              </p>

              <p>
                Explore our gallery; we believe{" "}
                <span className="font-semibold text-brand-dark">
                  you will definitely find something that relates to your situation
                </span>{" "}
                and inspires you to bring it home.{" "}
                <span className="font-semibold text-brand-dark">
                  Sometimes, things like candles are the best way to say what you cannot express to
                  others
                </span>{" "}
                and share what you truly want to say.
              </p>
            </div>

            <div className="relative">
              <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                <div className="h-[200px] rounded-[24px] bg-[#bcbcbc]" />
                <div className="h-[200px] rounded-[24px] bg-[#ececec]" />
                <div className="h-[200px] rounded-[24px] bg-[#bcbcbc]" />
                <div className="h-[240px] rounded-[28px] bg-[#b8b8b8]" />
              </div>

              <div className="relative hidden min-h-[620px] lg:block">
                <div className="absolute left-0 top-[76px] h-[280px] w-[34%] rounded-[28px] bg-[#bcbcbc]" />
                <div className="absolute left-0 top-[386px] h-[280px] w-[34%] rounded-[28px] bg-[#bcbcbc]" />
                <div className="absolute right-[14px] top-[106px] h-[204px] w-[63%] rounded-[24px] bg-[#ececec]" />
                <div className="absolute right-0 top-[146px] h-[458px] w-[69%] rounded-[30px] bg-[#b8b8b8]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
