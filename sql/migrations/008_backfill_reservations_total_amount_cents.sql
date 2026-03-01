UPDATE reservations SET total_amount_cents = CAST(ROUND(total_amount * 100) AS INTEGER) WHERE total_amount_cents = 0;
