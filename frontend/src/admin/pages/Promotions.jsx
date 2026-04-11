import { useMemo } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import AnnouncementBarManager from "../components/AnnouncementBarManager";
import TestimonialManager from "../components/TestimonialManager";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "../helpers";
import Banners from "./Banners";

const PROMOTION_TABS = [
  {
    value: "announcement-bar",
    label: "Announcement Bar",
    eyebrow: "Top strip",
    summary: "Short, high-visibility storewide offers like free shipping thresholds and free gift unlocks.",
  },
  {
    value: "popup-campaigns",
    label: "Popup Campaigns",
    eyebrow: "Modal offer",
    summary: "Richer promotional moments with artwork, coupon linkage, CTA controls, and urgency.",
  },
  {
    value: "testimonials",
    label: "Testimonials",
    eyebrow: "Social proof",
    summary: "Curated home page customer stories that build trust and warmth without turning the section into a generic reviews feed.",
  },
];

function Promotions() {
  const navigate = useNavigate();
  const { search } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const tabValue = String(searchParams.get("tab") ?? "").trim().toLowerCase();
    return PROMOTION_TABS.some((tab) => tab.value === tabValue) ? tabValue : "announcement-bar";
  }, [searchParams]);

  const activeTabConfig = PROMOTION_TABS.find((tab) => tab.value === activeTab) ?? PROMOTION_TABS[0];

  const handleTabChange = (tabValue) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("tab", tabValue);
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Promotions</p>
            <h1 className="mt-2 text-3xl font-semibold text-brand-dark">Manage What Shoppers Notice First</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-muted">
              Use the announcement bar for short storewide messages, popup campaigns for stronger discount or gifting pushes,
              testimonials for curated trust-building stories, and coupons as the pricing engine underneath those experiences.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              onClick={() => handleTabChange("announcement-bar")}
            >
              Manage Top Strip
            </button>
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => navigate("/admin/coupons")}
            >
              Open Coupons
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PromotionGuideCard
            eyebrow="Announcement Bar"
            title="Best for concise nudges"
            copy="Free delivery above a threshold, free gift unlocks, app-first offers, or sale date reminders."
          />
          <PromotionGuideCard
            eyebrow="Popup Campaigns"
            title="Best for richer launches"
            copy="Visual offers with coupon linkage, CTA buttons, and stronger urgency when you really need a shopper decision."
          />
          <PromotionGuideCard
            eyebrow="Testimonials"
            title="Best for trust moments"
            copy="Curated customer stories that reassure shoppers about quality, gifting appeal, and how premium the products feel."
          />
          <PromotionGuideCard
            eyebrow="Coupons"
            title="Best for discount rules"
            copy="Keep discount logic, eligibility, and reusable codes in Coupons, then reference them from the top strip or popup."
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-black/10 bg-white p-2 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-2">
          {PROMOTION_TABS.map((tab) => {
            const isActive = tab.value === activeTab;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-[#17120f] bg-[#17120f] text-white shadow-[0_14px_28px_rgba(23,18,15,0.12)]"
                    : "border-transparent bg-[#fbf7f0] text-brand-dark hover:border-black/10"
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isActive ? "text-white/72" : "text-brand-muted"}`}>
                  {tab.eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{tab.label}</h2>
                <p className={`mt-2 text-sm leading-6 ${isActive ? "text-white/78" : "text-brand-muted"}`}>
                  {tab.summary}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        {activeTab === "announcement-bar" ? <AnnouncementBarManager search={search} /> : null}
        {activeTab === "popup-campaigns" ? <Banners /> : null}
        {activeTab === "testimonials" ? <TestimonialManager search={search} /> : null}
      </section>

      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Current Focus</p>
        <h3 className="mt-2 text-2xl font-semibold text-brand-dark">{activeTabConfig.label}</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-muted">
          {activeTabConfig.summary} Keep the message surface simple and let coupons handle the actual offer rules whenever possible.
        </p>
      </section>
    </div>
  );
}

function PromotionGuideCard({ eyebrow, title, copy }) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-[#fbf7f0] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-muted">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-brand-dark">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-brand-muted">{copy}</p>
    </div>
  );
}

export default Promotions;
