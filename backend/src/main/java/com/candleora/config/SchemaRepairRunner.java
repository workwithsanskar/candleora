package com.candleora.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SchemaRepairRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaRepairRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public SchemaRepairRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        addProductColumnsIfNeeded();
        backfillProductColumns();
    }

    private void addProductColumnsIfNeeded() {
        executeSchemaUpdate("ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00 NOT NULL");
        executeSchemaUpdate("ALTER TABLE products ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE NOT NULL");
    }

    private void backfillProductColumns() {
        executeSchemaUpdate("UPDATE products SET cost_price = CAST(price * 0.58 AS DECIMAL(10,2)) WHERE cost_price IS NULL OR cost_price = 0");
        executeSchemaUpdate("UPDATE products SET visible = TRUE WHERE visible IS NULL");
    }

    private void executeSchemaUpdate(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (RuntimeException exception) {
            log.warn("Schema repair statement failed: {}", sql, exception);
        }
    }
}
