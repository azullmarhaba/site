# ARCHITECTURE — AZUL / MARHABA MOROCCO 2027

> PHASE 01 deliverable. This document is the engineering source of truth for the platform.

## 1. Stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (latest stable), App Router, TypeScript strict** | Server Components by default; `"use client"` only where interaction requires it |
| Styling | **Tailwind CSS** + CSS custom properties for brand tokens | Design tokens in `styles/tokens.css`, consumed by `tailwind.config` |
| Animation | **Framer Motion** (React choreography) + **GSAP/ScrollTrigger** (scroll-linked) | Loaded dynamically; `prefers-reduced-motion` respected globally |
| Icons | **Lucide React** | No emoji as icons |
| Forms | **React Hook Form + Zod** | Same Zod schema shared client/server |
| Database | **MySQL/MariaDB via XAMPP** (`azul_morocco`) | `DATABASE_URL="mysql://root:@localhost:3306/azul_morocco"` — env only |
| ORM | **Prisma** | Migrations + typed client; all queries through it (no raw SQL concat) |
| Auth | **Auth.js (NextAuth v5)** — Credentials (bcrypt) + optional Google | JWT session strategy; role + permissions in token; **every** protected action re-verified server-side |
| Validation | **Zod** | API route contracts |
| Email | SMTP via env (`EMAIL_SERVER`), dev-mode file/console transport fallback | Architecture ready, documented |
| Payments | **Provider abstraction** (`PaymentProvider` interface) — `DEVELOPMENT` provider default | MySQL stores status only; never PAN/CVV |

Forbidden: PostgreSQL, MongoDB, SQLite, hardcoded credentials, client-trusted prices.

## 2. Repository layout

```
D:\AZUL EGENCY\
├── docs/                      # PROJECT-AUDIT.md, ARCHITECTURE.md, phase notes
├── legacy/                    # preserved static prototype (index.html + css + js + assets)
├── public/
│   ├── brand/                 # azul-logo-light.png, azul-logo-dark.png, azul-icon.png
│   ├── favicon/               # favicon.ico, apple-touch-icon.png (from icons)
│   ├── social/                # opengraph-image / twitter-image (from logo_dark)
│   ├── images/                # destination & experience imagery (placeholders until licensed)
│   └── videos/                # azul-intro.mp4 (from Video Project.mp4)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (marketing)/       # /, destinations, experiences, tours, plan-my-trip, about, contact, blog, faq, reviews, privacy, terms
│   │   ├── (auth)/            # login, register, forgot/reset password
│   │   ├── book/[experience]/ # booking wizard
│   │   ├── booking/[reference]/
│   │   ├── account/           # customer dashboard
│   │   ├── admin/             # agency operations dashboard
│   │   ├── api/               # route handlers (see §9)
│   │   ├── sitemap.ts, robots.ts, opengraph-image.tsx
│   │   ├── not-found.tsx, error.tsx, global-error.tsx, loading.tsx
│   ├── components/
│   │   ├── brand/ navigation/ marketing/ experiences/ destinations/
│   │   ├── booking/ account/ admin/ layout/ ui/ whatsapp/
│   ├── lib/
│   │   ├── auth/ (config, guards, rbac)  ├── db/ (prisma client singleton)
│   │   ├── validation/ (zod schemas)     ├── permissions/ (role→permission map)
│   │   ├── seo/ (metadata builders)      ├── utils/ (cn, formatters, slug)
│   │   └── analytics/ (event bus)
│   ├── server/
│   │   ├── services/  (booking, payment, availability, review, trip-planner, notification, media, audit)
│   │   └── repositories/ (data access per entity)
│   ├── hooks/  ├── types/  ├── config/ (site, nav, constants)
│   ├── i18n/   (dictionaries en/fr/ar + provider)
│   └── styles/ (tokens.css, globals.css)
├── .env.example  .env (git-ignored)  .gitignore
├── package.json  tsconfig.json  next.config.ts  tailwind.config.ts
```

**Rules:** business logic lives in `src/server/services/`; components never call Prisma directly; repositories are the only layer importing Prisma (services compose repositories); API routes validate → authorize → call service → shape response.

## 3. Data model (Prisma / MySQL)

30 models, snake-cased tables via `@map`, `createdAt`/`updatedAt` on all, `deletedAt` soft-delete on content entities.

**Identity/RBAC:** `User` (email unique, passwordHash?, status, emailVerifiedAt) · `Role` (unique name: CUSTOMER, GUIDE, STAFF, MANAGER, ADMIN, SUPER_ADMIN) · `Permission` (unique `resource:action`) · `UserRole`/`RolePermission` join tables · `AuditLog` (actor, action, entity, entityId, diff JSON, ip, ua).

**Catalog:** `ExperienceCategory` (slug, name) · `Destination` (slug, name, region, coordinates, bestSeason, description, coverImage) · `Experience` (slug unique, title, category/destination FK, durationMinutes, priceMinor, currency, capacityMin/Max, difficulty, meetingPoint, pickupIncluded, status DRAFT|PUBLISHED|ARCHIVED, rating aggregate, includes/excludes/itinerary JSON) · `Tour` + `TourDate` (scheduled departures) · `Availability` (experienceId + date, capacityTotal, capacityBooked, closed) · `PickupLocation` · `Guide` (→User) · `VehicleCategory` + `Vehicle` (→Guide) · `Media` (filename, alt, width, height, bytes, mime) + `Gallery` join.

**Commerce:** `Customer` (→User, name, phone, locale, country) · `Booking` (**reference unique** `AZL-2027-000123`, status enum, experienceId, tourDateId?, customerId, dates, guests, mode PRIVATE|GROUP, pickupId, pricing snapshot: subtotalMinor, discountMinor, taxMinor, totalMinor, currency, specialRequests, internalNotes, guideId?, vehicleId?) · `BookingItem` (extras) · `BookingGuest` (lead + travellers) · `Payment` (bookingId, provider, providerRef, amountMinor, status enum, `mode LIVE|DEVELOPMENT`) · `Coupon` (code unique, percent/fixed, redemptionLimit, expiresAt) · `Favorite` (userId+experienceId unique) · `Review` (customerId, experienceId, bookingId unique → **verified**, rating 1–5, title, body, status PENDING|APPROVED|REJECTED, photos JSON).

**Content:** `BlogCategory` + `BlogPost` (slug, status, cover, SEO fields) · `FAQ` (category, question, answer, locale-agnostic + `Translation` rows) · `ContactMessage` · `Notification` (userId, type, payload JSON, readAt) · `SiteSetting` (key unique, value JSON) · `Translation` (entityType, entityId, locale, field, value) — composite unique `(entityType, entityId, locale, field)`.

**Enums (exact):**
```
BookingStatus   PENDING → CONFIRMED → PAID → IN_PROGRESS → COMPLETED
                 + CANCELLED, REFUNDED (terminal branches from any non-terminal)
PaymentStatus    PENDING → AUTHORIZED → PAID → FAILED → REFUNDED → CANCELLED
```

**Integrity:** FKs on every relation, `@@index` on slug, status, date ranges, (experienceId, date), reference; unique `(experienceId, date)` on `Availability`; `capacityBooked <= capacityTotal` enforced in service layer inside a transaction.

> Money is stored **minor units** (cents) + currency. Never `float`.

## 4. Booking business logic (server-side, transactional)

`BookingService.create()` runs in `prisma.$transaction`:
1. Zod-validate payload (structure only — **never prices**).
2. Authorize (session or guest checkout), resolve `Experience` by id/slug → read `priceMinor` from DB.
3. Date rules: not past, within published availability, `experience.status = PUBLISHED`.
4. Capacity: `capacityBooked + guests <= capacityTotal` → `SERIALIZABLE`-style guarded update (`updateMany` with condition) to prevent overbooking races.
5. Coupon (optional): validate redemption limits/expiry → discount computed server-side.
6. Compute subtotal/discount/tax/total server-side; snapshot onto booking.
7. Reference generator: `AZL-2027-{6 digits}` (unique-retry loop).
8. Create `Payment(PENDING, mode=DEVELOPMENT)` + notifications (BOOKING_CREATED, ADMIN_ALERT).
9. Audit log entry.

`PaymentService` interface:
```ts
interface PaymentProvider {
  id: string; mode: "LIVE" | "DEVELOPMENT";
  authorize(booking, ctx): Promise<{ providerRef: string }>;
  capture(providerRef): Promise<PaymentStatus>;
  refund(providerRef, amountMinor?): Promise<PaymentStatus>;
}
```
Providers registered in a map; `DEVELOPMENT` simulates authorize/capture/refund transitions **and is hard-blocked when `NODE_ENV === "production"` unless a live provider is configured**. Status transitions validated by a state machine (illegal transitions throw `409`).

Cancellation policy: free-cancel window per experience (`cancelWindowHours`), enforced in service → CANCELLED + refund attempt + capacity release.

## 5. Auth & RBAC

- **Auth.js v5**, JWT sessions (httpOnly, `Secure` in prod, `SameSite=Lax`), bcrypt(12) hashing.
- Roles: CUSTOMER → GUIDE → STAFF → MANAGER → ADMIN → SUPER_ADMIN. Permission strings `booking:read`, `booking:update`, `experience:write`, `review:moderate`, `user:manage`, `settings:write`…
- `requirePermission("x:y")` guard used by **both** server components and API routes; middleware only handles coarse redirects (unauthenticated → /login with `callbackUrl`).
- Account: login / register / forgot / reset / verify-email (token table or Auth.js verification tokens). Dev seed admin documented in README only.
- Route matrix: `/account/*` requires CUSTOMER+; `/admin/*` requires any staff role; mutating APIs require CSRF-safe origin check + auth.

## 6. i18n & RTL

- Locales: `en`, `fr`, `ar` (extensible via `src/i18n/locales.ts`).
- **Cookie-based locale** (`azul_locale`) + `Accept-Language` fallback → keeps spec-defined URLs clean (`/destinations` has no prefix).
- `<html lang dir>` set from locale; `ar → dir="rtl"`; Tailwind logical properties (`ms-*`, `me-*`, `start-*`, `end-*`) everywhere; directional icons mirrored via `rtl:rotate-180` where meaningful; animations that translate horizontally use logical transforms.
- Dictionaries: `src/i18n/{en,fr,ar}.ts`, typed `Dictionary` interface, missing-key fallback to `en` (dev warns).
- CMS strings (experience titles/descriptions/FAQ/blog) use the `Translation` table, locale-aware repository queries.

## 7. Public site & homepage

Routes exactly as specified (§9 of brief), all through `generateMetadata()` from `src/lib/seo`. Homepage sections 01–13 as specified; **motion budget**: preloader (video, first visit per session), hero mask-reveal, section 02/03 staggered reveals, map interactions, magnetic CTA — nothing else moves. GSAP ScrollTrigger used only for the horizontal storytelling and parallax; everything else is CSS/Framer, transform/opacity only.

**Interactive Morocco Map**: SVG map with 11 pins (Marrakech, Atlas, Agafay, Essaouira, Ouarzazate, Merzouga, Chefchaouen, Rabat, Casablanca, Ouzoud, Ourika) — desktop hover/focus panel (name, description, experiences, best season, duration, CTA); mobile becomes a snap-scroll destination selector. 2D/SVG, not WebGL (perf rule: no global Three.js).

**Trip planner** (`/plan-my-trip`): 6-step wizard (days, travel style, interests, destinations, budget, group) → deterministic itinerary generator over destination/experience data → day cards with duration + estimated cost → save (authenticated → DB `TripPlan` JSON on Customer, else localStorage), share (encoded URL state), book (deep-links into booking flow).

## 8. Booking UX

`/book/[experience]` — 9 steps (date → guests → private/group → pickup → customer → requests → summary → payment → confirmation). Price summary recomputed from server quote endpoint (`POST /api/bookings/quote`) — client displays, never dictates. Confirmation `/booking/[reference]` shows all required fields + print stylesheet (`@media print`) + QR (client-generated from reference URL). Loading/empty/error states per component spec.

## 9. API conventions

`/api/*` route handlers; envelope:
```json
{ "ok": true, "data": ... }        // 200/201
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": {...} } }
```
Codes: `UNAUTHENTICATED(401)`, `FORBIDDEN(403)`, `NOT_FOUND(404)`, `VALIDATION_ERROR(422)`, `CONFLICT(409)`, `RATE_LIMITED(429)`, `INTERNAL(500)`.
Resource groups: auth, users, customers, experiences, destinations, tours, availability, bookings, quote, payments, reviews, favorites, guides, vehicles, media, blog, faq, contact, notifications, settings, translations, planner, analytics.
Rate limiting: in-memory sliding window on auth + contact + quote endpoints (architecture allows Redis swap).

## 10. Admin dashboard

`/admin` layout with `AdminSidebar` + `AdminHeader` (role-gated nav), overview cards (revenue, bookings, conversion, pending payments, upcoming tours, recent reviews) + charts (lightweight SVG bars — no chart lib unless needed). Data tables with server-driven pagination/filtering (date, status, experience, guide, customer, payment). Full CRUD for experiences/categories/destinations/tours/availability/guides/vehicles/pickups/media/blog/faq/users/roles/translations/settings; review moderation queue; contact inbox; audit log viewer. Each mutation writes an `AuditLog` row.

## 11. SEO

Per-page `generateMetadata` (title/description/canonical/OG/Twitter), JSON-LD: `TouristTrip`+`TravelAgency` (site), `TouristAttraction`/`Place` (destinations), `Product`+`AggregateRating`+`Offer` (experiences), `FAQPage` (faq), `BreadcrumbList`. `sitemap.ts` (published entities + static routes), `robots.ts`, `hreflang` alternates for en/fr/ar (x-default en). Keyword themes: Morocco tourism, Marrakech excursions, Agafay desert, Atlas Mountains, Morocco travel experiences — natural placement only.

## 12. Performance

Targets: LCP < 2.5 s, CLS < 0.1, INP < 200 ms, Lighthouse 90+. Levers: Server Components (no client JS for static content), `next/image` with real dimensions (logos 5000² must be rendered small + `sizes`), `next/font` (self-hosted fonts — display serif + UI sans + Arabic face), dynamic `import()` for GSAP/lightbox/map-heavy code, route-level code splitting (default), video `preload="metadata"` (preloader only), no global Three.js, animation on transform/opacity only, `content-visibility` for below-fold sections.

## 13. Accessibility

WCAG 2.2 AA: semantic landmarks, skip link, visible focus (`:focus-visible`), 44 px targets, form labels + inline errors + `aria-describedby`, alt text discipline, contrast ≥ 4.5:1 (ivory-on-obsidian and sand accents verified), keyboard-complete booking wizard and admin tables, `prefers-reduced-motion` kills all non-essential motion.

## 14. Security

Zod at every boundary; Prisma parameterization; RBAC re-checked server-side every request; httpOnly/secure cookies + Auth.js CSRF; security headers in `next.config` (CSP, X-Frame-Options, Referrer-Policy, HSTS in prod); env-only secrets (`.env` git-ignored, `.env.example` committed); payment card data never enters our systems; audit trail; upload validation (mime/size) for admin media; error boundaries never leak stack traces in prod.

## 15. Notifications & channels

`NotificationService` emits domain events (BOOKING_CREATED/CONFIRMED/CANCELLED, PAYMENT_RECEIVED, TRIP_REMINDER, REVIEW_REQUEST) → persisted rows + email via SMTP abstraction (console transport in dev). WhatsApp = floating `WhatsAppButton` reading `NEXT_PUBLIC_WHATSAPP_NUMBER` from env (site-wide + contextual labels), never hardcoded.

## 16. Analytics

`lib/analytics` client bus: `page_view`, `experience_view`, `planner_started/completed`, `booking_started/completed`, `cta_clicked`, `destination_selected` — payload excludes PII; dev logs to console, production hook point documented (GA4/Plausible via env flag).

## 17. Testing & phase gates

After each phase: `npx tsc --noEmit` · `npm run lint` · `npm run build` (when applicable) · manual route probe via headless Chrome. No known errors accumulate between phases.

## 18. Delivery phases

01 Audit (this) → 02 Scaffold → 03 Brand/design system → 04 Schema → 05 XAMPP/Prisma connection + seed → 06 Core UI → 07 Homepage → 08 Destinations → 09 Experiences → 10 Trip planner → 11 Booking engine → 12 Auth → 13 Customer account → 14 Admin → 15 Reviews → 16 CMS → 17 SEO → 18 Security → 19 Performance → 20 Responsive/RTL QA → 21 Production prep.
