import { Link } from "react-router-dom";

function AboutUs() {
  return (
    <div className="bg-white">
      <section className="container-shell py-8 sm:py-10 lg:py-11">
        <div className="mx-auto max-w-[1420px]">
          <h1 className="text-center font-display text-[3rem] font-semibold leading-[0.92] tracking-[-0.06em] text-black sm:text-[4rem] lg:text-[5.3rem]">
            Who We Are &amp; What We Do
          </h1>

          <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(540px,0.98fr)] lg:items-start lg:gap-10 xl:gap-12">
            <div className="max-w-[740px] space-y-9 text-[1.04rem] leading-[1.78] text-brand-dark/80">
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
                <div className="h-[210px] rounded-[26px] bg-[#c3c3c3]" />
                <div className="h-[170px] rounded-[24px] bg-[#eeeeee]" />
                <div className="h-[210px] rounded-[26px] bg-[#c3c3c3]" />
                <div className="h-[260px] rounded-[28px] bg-[#b9b9b9]" />
              </div>

              <div className="relative hidden min-h-[760px] lg:block">
                <div className="absolute left-0 top-[128px] h-[350px] w-[33%] rounded-[34px] bg-[#c3c3c3]" />
                <div className="absolute left-0 top-[540px] h-[260px] w-[33%] rounded-[30px] bg-[#c3c3c3]" />
                <div className="absolute right-[18px] top-[170px] h-[150px] w-[66%] rounded-[28px] bg-[#eeeeee]" />
                <div className="absolute right-0 top-[220px] h-[520px] w-[72%] rounded-[34px] bg-[#b9b9b9]" />
              </div>
            </div>
          </div>

          <section className="mt-14 border-t border-black/8 pt-12 lg:mt-16 lg:pt-14">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:gap-14">
              <div>
                <p className="eyebrow">What Guides Us</p>
                <h2 className="mt-3 max-w-[420px] font-display text-[2.15rem] font-semibold leading-[1.02] tracking-[-0.04em] text-black sm:text-[2.6rem]">
                  Handmade candles that carry meaning into everyday spaces.
                </h2>
                <p className="mt-5 max-w-[420px] text-[1rem] leading-7 text-black/68">
                  We do not treat candles as decor alone. Every vessel, fragrance, and finish is
                  chosen to feel personal, giftable, and emotionally resonant in the spaces people
                  return to every day.
                </p>
              </div>

              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                <article className="border-t border-black/12 pt-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Intention
                  </p>
                  <h3 className="mt-3 text-[1.25rem] font-semibold leading-tight text-black">
                    Designed for real moods
                  </h3>
                  <p className="mt-3 text-[0.98rem] leading-7 text-black/68">
                    From calm evenings to housewarming gifts, each candle is shaped around how you
                    want a room to feel.
                  </p>
                </article>

                <article className="border-t border-black/12 pt-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Craft
                  </p>
                  <h3 className="mt-3 text-[1.25rem] font-semibold leading-tight text-black">
                    Poured with care, not volume
                  </h3>
                  <p className="mt-3 text-[0.98rem] leading-7 text-black/68">
                    We focus on finish, fragrance balance, and form so every piece feels deliberate
                    instead of mass-produced.
                  </p>
                </article>

                <article className="border-t border-black/12 pt-5 sm:col-span-2 lg:col-span-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Feeling
                  </p>
                  <h3 className="mt-3 text-[1.25rem] font-semibold leading-tight text-black">
                    A quieter way to say something
                  </h3>
                  <p className="mt-3 text-[0.98rem] leading-7 text-black/68">
                    Sometimes a candle becomes the gesture, the gift, or the atmosphere that says
                    what words cannot.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="mt-14 lg:mt-16">
            <div className="overflow-hidden rounded-[34px] border border-black/8 bg-[#fbf5eb]">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
                <div className="px-7 py-9 sm:px-10 lg:px-12 lg:py-12">
                  <p className="eyebrow">Our Belief</p>
                  <blockquote className="mt-4 max-w-[720px] font-display text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-black sm:text-[2.55rem]">
                    A candle should not just light a room. It should change how the room feels.
                  </blockquote>
                  <p className="mt-5 max-w-[620px] text-[1rem] leading-7 text-black/68">
                    That is why we care so much about story, fragrance, and presence. We want every
                    CandleOra piece to feel like it belongs in someone&apos;s ritual, gifting moment, or
                    quiet corner at home.
                  </p>
                </div>

                <div className="border-t border-black/8 px-7 py-9 sm:px-10 lg:border-l lg:border-t-0 lg:px-10 lg:py-12">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">
                        Best For
                      </p>
                      <p className="mt-2 text-[1rem] leading-7 text-black/72">
                        thoughtful gifting, mood-setting decor, and everyday rituals that deserve a
                        little softness.
                      </p>
                    </div>

                    <div className="border-t border-black/8 pt-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">
                        What We Want You To Feel
                      </p>
                      <p className="mt-2 text-[1rem] leading-7 text-black/72">
                        calm, warmth, comfort, and the sense that the object in your hand was made
                        with a person in mind.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14 border-t border-black/8 pt-10 lg:mt-16 lg:pt-12">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[720px]">
                <p className="eyebrow">Explore CandleOra</p>
                <h2 className="mt-3 font-display text-[2.1rem] font-semibold leading-[1.02] tracking-[-0.04em] text-black sm:text-[2.8rem]">
                  Find the candle that feels closest to your moment.
                </h2>
                <p className="mt-4 text-[1rem] leading-7 text-black/68">
                  Whether you are choosing for yourself or for someone else, explore the collection
                  and discover a piece that feels personal enough to bring home.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/shop"
                  className="btn btn-primary min-w-[180px] rounded-full px-7"
                >
                  Explore the shop
                </Link>
                <Link
                  to="/contact"
                  className="btn btn-outline min-w-[180px] rounded-full px-7"
                >
                  Contact CandleOra
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
