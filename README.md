# PadelClub - Sistema de Reservas (Next.js + Turso + Mercado Pago)

Sistema full-stack de reservas de canchas (público + admin) con:
- Next.js App Router + Tailwind
- Turso/libSQL con `@libsql/client`
- Auth staff JWT en cookie httpOnly
- Lógica de reservas server-side (HOLD, concurrencia anti-solapamiento)
- 4 métodos de pago:
  - `CASH` (manual)
  - `CARD_MP` (Mercado Pago)
  - `WALLET_MP` (Mercado Pago)
  - `TRANSFER_EXTERNAL` (manual)
- Webhook MP con verificación de firma + idempotencia

## 1) Variables de entorno

Crear `.env.local` desde `.env.example`:

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
NEXT_PUBLIC_MP_PUBLIC_KEY=
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
JWT_SECRET=
CLUB_TRANSFER_INFO_ALIAS=
CLUB_TRANSFER_INFO_CBU=
CLUB_TRANSFER_INFO_TITULAR=
CLUB_TRANSFER_INFO_BANK=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2) Base de datos Turso

Aplicar esquema:

```sql
-- sql/schema.sql
```

Luego seed:

```sql
-- sql/seed.sql
```

Tablas incluidas:
- `clubs`, `courts`, `events`, `staff_users`, `reservations`, `blocks`,
  `pricing_rules`, `payments`, `audit_logs`, `message_logs`

Índices obligatorios incluidos:
- `reservations(club_id, court_id, start_at)`
- `reservations(club_id, status)`
- `payments(reservation_id)`

## 3) Desarrollo local

```bash
npm install
npm run dev
```

Rutas:
- Público: `/`, `/reservar`, `/checkout/:bookingCode`, `/confirmacion/:bookingCode`, `/eventos`, `/nosotros`, `/gestionar?token=...`
- Admin: `/admin/login`, `/admin/reservas`, `/admin/canchas`, `/admin/eventos`, `/admin/ajustes`

Credenciales seed:
- Admin: `admin@club.com / admin123`
- Secretario: `secretario@club.com / secre123`

## 4) Pagos Mercado Pago

Endpoints:
- `POST /api/payments/mp/create`
- `POST /api/payments/mp/webhook`

Flujo:
1. Confirmar reserva en checkout (`/api/public/reservations/confirm`)
2. Si método online (`card` o `wallet`) crear preferencia MP (`/api/payments/mp/create`)
3. Redirigir a `init_point`
4. MP notifica webhook y se actualiza `payments` y `reservations.payment_status`

## 5) Despliegue en Vercel

1. Subir repo a GitHub.
2. Crear proyecto en Vercel.
3. Cargar variables de entorno.
4. Verificar URL pública en `NEXT_PUBLIC_APP_URL`.
5. Configurar webhook MP apuntando a:
   - `https://tu-dominio.com/api/payments/mp/webhook`

## 6) Transferencia externa (manual)

El checkout muestra instrucciones de transferencia (alias/cbu/titular).
Al confirmar:
- estado reserva: `CONFIRMED`
- `payment_status`: `PENDING_TRANSFER_EXTERNAL`

Staff puede marcar pago como cobrado:
- `PATCH /api/admin/pagos/:id/mark-paid`
