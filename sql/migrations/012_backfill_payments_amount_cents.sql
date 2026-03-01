UPDATE payments SET amount_cents = CAST(ROUND(amount * 100) AS INTEGER) WHERE amount_cents = 0;
