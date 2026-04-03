CREATE TABLE IF NOT EXISTS product_similar_products (
    product_id BIGINT NOT NULL,
    similar_product_id BIGINT NOT NULL,
    sort_order INTEGER NOT NULL,
    CONSTRAINT pk_product_similar_products PRIMARY KEY (product_id, sort_order),
    CONSTRAINT uk_product_similar_products_pair UNIQUE (product_id, similar_product_id),
    CONSTRAINT fk_product_similar_products_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_similar_products_similar
        FOREIGN KEY (similar_product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_similar_products_similar_product_id
    ON product_similar_products(similar_product_id);
