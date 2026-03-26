import PropTypes from "prop-types";
import logoImage from "../assets/designer/logo-candleora-web-optimized.png";

function BrandLogo({ tone, compact, showTagline, className, imageClassName }) {
  const wrapperClassName = compact
    ? "max-w-[120px] sm:max-w-[160px]"
    : "max-w-[220px] sm:max-w-[300px]";
  const toneClassName = tone === "light" ? "brightness-0 invert opacity-95" : "";

  return (
    <span className={`inline-flex flex-col ${wrapperClassName} ${className}`.trim()}>
      <img
        src={logoImage}
        alt="CandleOra"
        className={`h-auto w-full object-contain ${toneClassName} ${imageClassName}`.trim()}
      />
      {!showTagline && <span className="sr-only">CandleOra</span>}
    </span>
  );
}

BrandLogo.propTypes = {
  tone: PropTypes.oneOf(["dark", "light"]),
  compact: PropTypes.bool,
  showTagline: PropTypes.bool,
  className: PropTypes.string,
  imageClassName: PropTypes.string,
};

BrandLogo.defaultProps = {
  tone: "dark",
  compact: false,
  showTagline: true,
  className: "",
  imageClassName: "",
};

export default BrandLogo;
