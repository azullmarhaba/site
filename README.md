# AZUL — MARHABA MOROCCO 2027

**Your Morocco starts here.** A production-quality digital tourism platform for premium
Moroccan excursions: cinematic marketing site, intelligent trip planner, real-time
booking engine, customer accounts and a full back-office — built with Next.js 16,
Prisma 7 and MySQL (XAMPP).

---

## Requirements

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 20 | verified on 24.x |
| npm | ≥ 10 | verified on 12.x |
| XAMPP | ≥ 8 | MariaDB 10.4 on port **3306** |
| phpMyAdmin | bundled | optional, GUI for `azul_morocco` |

---

## Quick start (XAMPP)

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

`.env` ships pre-configured for XAMPP defaults:

```env
DATABASE_URL="mysql://root:@localhost:3306/azul_morocco"
AUTH_SECRET="generate-a-long-random-string-for-prod"
NEXT_PUBLIC_WHATSAPP_NUMBER="212600000000"
```

> Root with empty password is the XAMPP default. Change it and update `DATABASE_URL`
> if your MySQL root has a password.

### 3. Start the database

Open the **XAMPP Control Panel** → start **MySQL** (and Apache if you want phpMyAdmin).
Verify:

```bash
C:\xampp\mysql\bin\mysql.exe -uroot -e "SELECT VERSION();"
```

### 4. Create the database

Either phpMyAdmin → *New* → `azul_morocco` → *utf8mb4_unicode_ci*, or CLI:

```bash
C:\xampp\mysql\bin\mysql.exe -uroot -e "CREATE DATABASE azul_morocco CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 5. Migrate + seed

```bash
npm run db:migrate    # prisma migrate dev — creates all 37 tables
npm run db:seed       # realistic demo data + placeholder artwork
```

### 6. Run

```bash
npm run dev           # http://localhost:3000
```

---

## Demo accounts

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Super admin | `admin@azul.ma` | `AzulAdmin!2027` | `/admin` full access |
| Staff | `staff@azul.ma` | `AzulStaff!2027` | `/admin` operations |
| Guide | `youssef@azul.ma` | `AzulGuide!2027` | assigned tours |
| Customer | `aisha@example.com` | `AzulDemo!2027` | `/account` demo bookings |

Payments run in **DEVELOPMENT mode**: any future date, any 16-digit number, any CVC —
no real charge, no card data stored.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | start Next.js (Turbopack) |
| `npm run build` | production build |
| `npm run start` | serve production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm run db:migrate` | create/apply migrations (dev) |
| `npm run db:deploy` | apply migrations (production) |
| `npm run db:seed` | seed demo data (idempotent) |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:generate` | regenerate Prisma client |

---

## Stack

- **Framework** — Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- **Styling** — Tailwind CSS v4, custom design tokens (Obsidian/Ivory/Sand/Clay/Atlas)
- **Motion** — Framer Motion + GSAP (reduced-motion respected)
- **Forms/validation** — React Hook Form + Zod
- **Data** — Prisma 7 + MariaDB (XAMPP), driver adapter `@prisma/adapter-mariadb`
- **Auth** — NextAuth (credentials, bcrypt, RBAC CUSTOMER → SUPER_ADMIN)
- **i18n** — cookie-based EN / FR / AR with true RTL (logical CSS properties)

## Project structure

```
prisma/            schema.prisma, migrations, seed.ts
docs/              PROJECT-AUDIT.md, ARCHITECTURE.md
legacy/            preserved static prototype (visual reference)
public/            brand assets, placeholder artwork, video
src/
  app/             routes (public, /account, /admin, api)
  components/      reusable UI system
  config/          site configuration
  lib/             db, auth, i18n, validation, utilities
  server/          services, repositories (Prisma-only)
  styles/          design tokens
```

## Security notes

- `.env` is git-ignored; only `.env.example` is committed.
- All queries go through Prisma (parameterised — no string-built SQL).
- Authorization is enforced server-side on every API route; cookies are
  `httpOnly` + `secure` in production.
- Mutations write `audit_logs` rows with actor, entity and diff.

---

*AZUL — MARHABA MOROCCO 2027 · demo content and reviews are marked `[DEMO]`.*
