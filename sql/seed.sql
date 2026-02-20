INSERT INTO clubs (id, name, slug, phone, email, address, timezone, transfer_alias, transfer_cbu, transfer_holder, transfer_bank)
VALUES
  (1, 'Club Deportivo', 'club-deportivo', '+5491122334455', 'info@club.com', 'Av. de los Deportes 123', 'UTC', 'club.padel.alias', '0000003100000000000000', 'Club Deportivo SA', 'Banco Demo')
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  slug = excluded.slug;

INSERT INTO staff_users (club_id, full_name, email, password_hash, role, active)
VALUES
  (1, 'Admin Club', 'admin@club.com', 'admin123', 'ADMIN', 1),
  (1, 'Secretario Club', 'secretario@club.com', 'secre123', 'SECRETARY', 1)
ON CONFLICT(email) DO UPDATE SET
  full_name = excluded.full_name,
  role = excluded.role,
  active = excluded.active;

INSERT INTO courts (club_id, name, sport, image_url, surface, location_type, status, price_per_hour, min_duration_min)
VALUES
  (1, 'Pista 1 - Cristal', 'PADEL', '/ui-screens/pista-padel-cubierta.avif', 'CRISTAL', 'CUBIERTA', 'ACTIVE', 22, 90),
  (1, 'Pista 2 - Panorámica', 'PADEL', '/ui-screens/canchaalquilada.jpg', 'PANORAMICA', 'EXTERIOR', 'ACTIVE', 20, 90),
  (1, 'Fútbol 5 (A)', 'FUTBOL', '/ui-screens/futbol5.webp', 'SINTETICO', 'EXTERIOR', 'ACTIVE', 45, 60),
  (1, 'Tenis Central', 'TENIS', '/ui-screens/canchatenis.jpg', 'LADRILLO', 'EXTERIOR', 'ACTIVE', 30, 60);

INSERT INTO events (club_id, title, description, sport, starts_at, spots_left, status, image_url)
VALUES
  (1, 'Saturday Padel Open', 'Torneo semanal para todo nivel', 'PADEL', datetime('now', '+2 day'), 4, 'PUBLISHED', '/ui-screens/08-eventos.png'),
  (1, 'Monday 5v5 Scrimmage', 'Partido amistoso', 'FUTBOL', datetime('now', '+4 day'), 8, 'PUBLISHED', '/ui-screens/08-eventos.png'),
  (1, 'Junior Tennis Clinic', 'Clínica de tenis para juniors', 'TENIS', datetime('now', '+5 day'), 0, 'PUBLISHED', '/ui-screens/08-eventos.png');

INSERT INTO reservations (
  club_id, court_id, booking_code, status, payment_status, payment_method, start_at, end_at, duration_min,
  customer_name, customer_phone, customer_email, notes, total_amount
)
VALUES
  (1, 1, 'PX-9928', 'CONFIRMED', 'PAID', 'CARD_MP', datetime('now', '+1 day', '18 hour'), datetime('now', '+1 day', '19 hour', '+30 minute'), 90,
   'Ricardo Martinez', '+5491133344455', 'ricardo@mail.com', '', 22);
