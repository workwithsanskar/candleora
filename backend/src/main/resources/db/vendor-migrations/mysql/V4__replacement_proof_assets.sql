ALTER TABLE replacement_requests
    ADD COLUMN IF NOT EXISTS proof_asset_urls LONGTEXT;
