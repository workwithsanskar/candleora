import PropTypes from "prop-types";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";

function ProductGrid({ products }) {
  const visibleProducts = products.slice(0, 4);

  if (!visibleProducts.length) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {visibleProducts.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
        >
          <ProductCard product={product} variant="homepage" />
        </motion.div>
      ))}
    </div>
  );
}

ProductGrid.propTypes = {
  products: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default ProductGrid;
