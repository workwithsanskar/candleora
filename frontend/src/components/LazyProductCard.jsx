import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

function LazyProductCard({ product, priority = false, viewportMargin = "260px 0px" }) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, {
    once: true,
    margin: viewportMargin,
  });
  const [shouldRenderCard, setShouldRenderCard] = useState(priority);

  useEffect(() => {
    if (isInView) {
      setShouldRenderCard(true);
    }
  }, [isInView]);

  return (
    <div ref={cardRef}>
      {shouldRenderCard ? <ProductCard product={product} /> : <ProductCardSkeleton />}
    </div>
  );
}

LazyProductCard.propTypes = {
  priority: PropTypes.bool,
  product: PropTypes.object.isRequired,
  viewportMargin: PropTypes.string,
};

export default LazyProductCard;
