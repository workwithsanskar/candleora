ALTER TABLE orders
    ADD COLUMN admin_reviewed_at DATETIME(6) NULL;

ALTER TABLE replacement_requests
    ADD COLUMN admin_reviewed_at DATETIME(6) NULL;

ALTER TABLE contact_messages
    ADD COLUMN admin_reviewed_at DATETIME(6) NULL;
