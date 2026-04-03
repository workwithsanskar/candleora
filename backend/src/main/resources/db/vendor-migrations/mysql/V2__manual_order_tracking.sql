CREATE TABLE IF NOT EXISTS order_tracking_events (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    detail VARCHAR(1000),
    event_timestamp DATETIME(6)
);

CREATE UNIQUE INDEX uk_order_tracking_events_order_status
    ON order_tracking_events(order_id, status);
CREATE INDEX idx_order_tracking_events_order_event_timestamp
    ON order_tracking_events(order_id, event_timestamp DESC);
