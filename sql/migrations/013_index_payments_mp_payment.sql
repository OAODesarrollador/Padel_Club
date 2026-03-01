CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_mp_payment_id ON payments(mp_payment_id) WHERE mp_payment_id IS NOT NULL;
