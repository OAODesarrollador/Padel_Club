PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  transfer_alias TEXT,
  transfer_cbu TEXT,
  transfer_holder TEXT,
  transfer_bank TEXT,
  hold_minutes INTEGER NOT NULL DEFAULT 7,
  cancel_hours_before INTEGER NOT NULL DEFAULT 2,
  reschedule_limit INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sport TEXT NOT NULL CHECK(sport IN ('PADEL','FUTBOL','TENIS')),
  image_url TEXT,
  surface TEXT,
  location_type TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','MAINTENANCE')),
  price_per_hour_cents INTEGER NOT NULL DEFAULT 0,
  min_duration_min INTEGER NOT NULL DEFAULT 60,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL CHECK(sport IN ('PADEL','FUTBOL','TENIS')),
  starts_at TEXT NOT NULL,
  spots_left INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED')),
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS staff_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN','SECRETARY')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  court_id INTEGER NOT NULL,
  booking_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('HOLD','CONFIRMED','CANCELED','NO_SHOW')),
  payment_status TEXT NOT NULL DEFAULT 'UNDEFINED',
  payment_method TEXT,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  manage_token_hash TEXT,
  cancel_reason TEXT,
  canceled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (court_id) REFERENCES courts(id)
);

CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  court_id INTEGER,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (court_id) REFERENCES courts(id)
);

CREATE TABLE IF NOT EXISTS pricing_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  court_id INTEGER,
  sport TEXT,
  day_of_week INTEGER,
  from_hour INTEGER,
  to_hour INTEGER,
  price_cents INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (court_id) REFERENCES courts(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  reservation_id INTEGER NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('CASH','CARD_MP','WALLET_MP','TRANSFER_EXTERNAL')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  status TEXT NOT NULL CHECK(status IN ('PENDING','PAID','REJECTED')),
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  raw_payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER,
  staff_user_id INTEGER,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id INTEGER,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (staff_user_id) REFERENCES staff_users(id)
);

CREATE TABLE IF NOT EXISTS message_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  reservation_id INTEGER,
  channel TEXT NOT NULL,
  recipient TEXT,
  body TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE INDEX IF NOT EXISTS idx_reservations_club_court_start ON reservations(club_id, court_id, start_at);
CREATE INDEX IF NOT EXISTS idx_reservations_club_status ON reservations(club_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_club_mp_payment ON payments(club_id, mp_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_mp_payment_id ON payments(mp_payment_id) WHERE mp_payment_id IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_clubs_updated_at
AFTER UPDATE ON clubs
FOR EACH ROW
BEGIN
  UPDATE clubs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_courts_updated_at
AFTER UPDATE ON courts
FOR EACH ROW
BEGIN
  UPDATE courts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_events_updated_at
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
  UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_staff_users_updated_at
AFTER UPDATE ON staff_users
FOR EACH ROW
BEGIN
  UPDATE staff_users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_reservations_updated_at
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
  UPDATE reservations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_pricing_rules_updated_at
AFTER UPDATE ON pricing_rules
FOR EACH ROW
BEGIN
  UPDATE pricing_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_updated_at
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
