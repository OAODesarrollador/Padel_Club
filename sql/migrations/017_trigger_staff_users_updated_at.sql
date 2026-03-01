CREATE TRIGGER IF NOT EXISTS trg_staff_users_updated_at
AFTER UPDATE ON staff_users
FOR EACH ROW
BEGIN
  UPDATE staff_users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
