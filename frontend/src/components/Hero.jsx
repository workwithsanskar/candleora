import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Hero({ image, title, ctaTo = "/shop", ctaLabel = "Shop Now" }) {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div className="relative h-[440px] w-full sm:h-[540px] lg:h-[650px]">
        <img
          src={image}
          alt="Luxury candle arrangement"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.25)_28%,rgba(0,0,0,0)_56%)]" />
      </div>

      <div className="absolute inset-0">
        <div className="mx-auto flex h-full max-w-[1440px] items-center px-6 sm:px-10 lg:px-[66px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-[666px] text-white"
          >
            <h1 className="font-display text-heading-md font-semibold leading-[1.05] text-white sm:text-heading-lg">
              {title}
            </h1>

            <div className="pt-6">
              <Link
                to={ctaTo}
                className="inline-flex h-[48px] items-center justify-center rounded-[6px] bg-white px-6 text-[14px] font-semibold text-[#1A1A1A] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#f4f4f4]"
              >
                {ctaLabel}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

Hero.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  ctaTo: PropTypes.string,
  ctaLabel: PropTypes.string,
};

export default Hero;
