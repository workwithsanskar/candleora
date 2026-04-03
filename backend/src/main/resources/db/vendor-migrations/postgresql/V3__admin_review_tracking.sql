ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMPTZ;

ALTER TABLE replacement_requests
    ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMPTZ;

ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMP;
