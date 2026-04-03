CREATE TABLE IF NOT EXISTS product_similar_products (
    product_id BIGINT NOT NULL,
    similar_product_id BIGINT NOT NULL,
    sort_order INTEGER NOT NULL,
    CONSTRAINT pk_product_similar_products PRIMARY KEY (product_id, sort_order),
    CONSTRAINT uk_product_similar_products_pair UNIQUE (product_id, similar_product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_similar_products_similar_product_id
    ON product_similar_products(similar_product_id);
