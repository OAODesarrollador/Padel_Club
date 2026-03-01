CREATE TRIGGER IF NOT EXISTS trg_pricing_rules_updated_at
AFTER UPDATE ON pricing_rules
FOR EACH ROW
BEGIN
  UPDATE pricing_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
