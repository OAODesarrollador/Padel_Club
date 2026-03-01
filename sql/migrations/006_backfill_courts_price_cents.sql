UPDATE courts SET price_per_hour_cents = CAST(ROUND(price_per_hour * 100) AS INTEGER) WHERE price_per_hour_cents = 0;
