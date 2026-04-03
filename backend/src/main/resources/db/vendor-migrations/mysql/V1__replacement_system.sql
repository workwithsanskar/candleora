CREATE TABLE IF NOT EXISTS replacement_requests (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    order_item_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image_url VARCHAR(1024),
    reason VARCHAR(200) NOT NULL,
    customer_note VARCHAR(1000),
    status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',
    requested_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    approved_at DATETIME(6),
    proof_image_url VARCHAR(2048),
    admin_note VARCHAR(1000),
    is_fraud_suspected BOOLEAN NOT NULL DEFAULT FALSE,
    pickup_reference VARCHAR(255),
    pickup_status VARCHAR(128)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(1024);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at DATETIME(6);

CREATE INDEX idx_replacement_requests_order_id_requested_at
    ON replacement_requests(order_id, requested_at DESC);
CREATE INDEX idx_replacement_requests_status_requested_at
    ON replacement_requests(status, requested_at DESC);
CREATE INDEX idx_replacement_requests_fraud_requested_at
    ON replacement_requests(is_fraud_suspected, requested_at DESC);
