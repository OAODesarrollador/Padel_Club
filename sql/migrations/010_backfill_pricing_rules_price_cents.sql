UPDATE pricing_rules SET price_cents = CAST(ROUND(price * 100) AS INTEGER) WHERE price_cents = 0;
