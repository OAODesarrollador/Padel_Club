CREATE TRIGGER IF NOT EXISTS trg_reservations_updated_at
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
  UPDATE reservations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
