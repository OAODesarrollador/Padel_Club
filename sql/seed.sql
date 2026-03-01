INSERT INTO clubs (id, name, slug, phone, email, address, timezone, transfer_alias, transfer_cbu, transfer_holder, transfer_bank)
VALUES
  (1, 'Club Deportivo', 'club-deportivo', '+5491122334455', 'info@club.com', 'Av. de los Deportes 123', 'UTC', 'club.padel.alias', '0000003100000000000000', 'Club Deportivo SA', 'Banco Demo')
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  slug = excluded.slug;

INSERT INTO staff_users (club_id, full_name, email, password_hash, role, active)
VALUES
  (1, 'Admin Club', 'admin@club.com', '$2a$10$urKtCz68K.6/eRwzueEe6uah5Y0.ZcGVD0w8UFoSjrJlIA7.L0Aqq', 'ADMIN', 1),
  (1, 'Secretario Club', 'secretario@club.com', '$2a$10$SNw/d3/RHH5ByI6SdjKo6OCnP0smyo6DFILNIDcgxDAr8KRl7/9ju', 'SECRETARY', 1)
ON CONFLICT(email) DO UPDATE SET
  full_name = excluded.full_name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  active = excluded.active;

INSERT INTO courts (club_id, name, sport, image_url, surface, location_type, status, price_per_hour_cents, min_duration_min)
VALUES
  (1, 'Pista 1 - Cristal', 'PADEL', '/ui-screens/pista-padel-cubierta.avif', 'CRISTAL', 'CUBIERTA', 'ACTIVE', 2200, 90),
  (1, 'Pista 2 - Panorámica', 'PADEL', '/ui-screens/canchaalquilada.jpg', 'PANORAMICA', 'EXTERIOR', 'ACTIVE', 2000, 90),
  (1, 'Fútbol 5 (A)', 'FUTBOL', '/ui-screens/futbol5.webp', 'SINTETICO', 'EXTERIOR', 'ACTIVE', 4500, 60),
  (1, 'Tenis Central', 'TENIS', '/ui-screens/canchatenis.jpg', 'LADRILLO', 'EXTERIOR', 'ACTIVE', 3000, 60);

INSERT INTO events (club_id, title, description, sport, starts_at, spots_left, status, image_url)
VALUES
  (1, 'Saturday Padel Open', 'Torneo semanal para todo nivel', 'PADEL', datetime('now', '+2 day'), 4, 'PUBLISHED', '/ui-screens/08-eventos.png'),
  (1, 'Monday 5v5 Scrimmage', 'Partido amistoso', 'FUTBOL', datetime('now', '+4 day'), 8, 'PUBLISHED', '/ui-screens/08-eventos.png'),
  (1, 'Junior Tennis Clinic', 'Clínica de tenis para juniors', 'TENIS', datetime('now', '+5 day'), 0, 'PUBLISHED', '/ui-screens/08-eventos.png');

INSERT INTO reservations (
  club_id, court_id, booking_code, status, payment_status, payment_method, start_at, end_at, duration_min,
  customer_name, customer_phone, customer_email, notes, total_amount_cents
)
VALUES
  (1, 1, 'PX-9928', 'CONFIRMED', 'PAID', 'CARD_MP', datetime('now', '+1 day', '18 hour'), datetime('now', '+1 day', '19 hour', '+30 minute'), 90,
   'Ricardo Martinez', '+5491133344455', 'ricardo@mail.com', '', 2200)
ON CONFLICT(booking_code) DO UPDATE SET
  payment_status = excluded.payment_status,
  payment_method = excluded.payment_method,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  duration_min = excluded.duration_min,
  customer_name = excluded.customer_name,
  customer_phone = excluded.customer_phone,
  customer_email = excluded.customer_email,
  notes = excluded.notes,
  total_amount_cents = excluded.total_amount_cents;
