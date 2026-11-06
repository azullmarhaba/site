# PROJECT AUDIT — AZUL / MARHABA MOROCCO 2027

> PHASE 01 deliverable. Audited: 2026-10-07, from `D:\AZUL EGENCY`.

## 1. Current project structure

```
D:\AZUL EGENCY\
├── index.html                 # Static homepage (preloader + navbar + 5 sections)
├── css\style.css              # Design-system CSS (Aurora palette, ~17 KB)
├── js\main.js                 # Preloader / navbar / mobile menu / scroll-spy (~9 KB)
├── logos\
│   ├── logo_lightmode.png     # 5000×5000 px, 213 KB  (logo, light backgrounds)
│   ├── logo_darkmode.png      # 5000×5000 px, 199 KB  (logo, dark backgrounds)
│   ├── icon_lightmode.png     # 2000×2000 px          (icon, light backgrounds)
│   └── icon_darkmode.png      # 2000×2000 px          (icon, dark backgrounds)
└── video\
    └── Video Project.mp4      # 1.38 MB, 5.0 s, brand intro clip
```

No `package.json`, no `tsconfig.json`, no `next.config.*`, no `.env`, **no git repository**.

## 2. Existing technologies

| Area | Status |
|---|---|
| Frontend | Static HTML + CSS + vanilla JS (no framework, no build step) |
| Styling | Hand-written CSS with custom-property design tokens |
| Animation | CSS keyframes + transitions (no GSAP/Framer) |
| Backend | None |
| Database | None |
| Auth | None |
| i18n | None (English only) |
| Package manager | npm 12.0.2 / Node v24.19.0 available on machine |

## 3. Existing pages

Single page `index.html`: preloader → hero → destinations → experiences → about → contact → footer. All anchor navigation works; verified earlier via headless-Chrome DOM dump (no console errors, all 25 href/src references resolve).

## 4. Existing components (static, to be re-implemented in React)

- **Preloader** — plays `Video Project.mp4`, progress bar, % counter, skip button, reduced-motion fallback, 8 s hard timeout, removes itself from DOM. *Working; re-implement as `<Preloader/>`.*
- **Navbar** — fixed, glass on scroll, hide-on-scroll-down/show-on-up, reading-progress bar, scroll-spy, CTA, mobile fullscreen menu with focus-trap/Esc/scroll-lock. *Working; re-implement as `<Navbar/>` + `<MobileMenu/>`.*
- **Mobile menu, cards, hero stats, scroll progress** — reusable patterns, currently CSS class-based.

## 5. Existing assets

| Asset | Dimensions / spec | Use |
|---|---|---|
| `logo_lightmode.png` | 5000×5000 | Navbar/footer on light surfaces |
| `logo_darkmode.png` | 5000×5000 | Preloader, dark hero, dark footer |
| `icon_lightmode.png` | 2000×2000 | Favicon/apple-touch (light) |
| `icon_darkmode.png` | 2000×2000 | Favicon/apple-touch (dark) |
| `Video Project.mp4` | 1.38 MB / 5 s | Cinematic preloader background |

**Logos are 5000×5000 source PNGs** — ideal: no upscaling risk at any breakpoint; must be copied to `public/brand/` with correct names and served through `next/image` (or pre-sized variants) to avoid shipping 200 KB images at 44 px.

## 6. Existing database configuration

None. XAMPP is installed at `C:\xampp`:

- `C:\xampp\mysql\bin\mysql.exe` → **MariaDB 10.4.32** (XAMPP bundle) ✅
- MySQL service: **not running** (XAMPP runs it ad-hoc from the Control Panel, port 3306 currently closed).
- phpMyAdmin ships with XAMPP (available once MySQL is started).

## 7. Existing environment configuration

None (no `.env`, no `.env.example`, no `.gitignore`).

## 8. Existing problems / errors

1. Static site is a **one-off prototype**: no routing, no data layer, no booking, EN-only, no SEO metadata beyond basics, no structured data.
2. Navbar scroll-spy + preloader logic are solid but are **tightly coupled to the single-page DOM** — must be re-thought as route-aware React components.
3. `css/style.css` uses a **sky-blue/orange "Aurora" palette** — conflicts with the required AZUL brand palette (`#080808 / #F5F1E8 / #C89B6D / #9E2F2F / #53624D`). Palette must be replaced, structure/tokens can be kept as reference.
4. Assets live outside any `public/` contract; the video filename contains a space (`Video Project.mp4`) — must be URL-encoded or renamed when copied into `public/`.
5. No version control — git must be initialized for a production codebase.

## 9. What can be reused

- ✅ Brand assets (4 PNGs + video) — copied into `public/brand/` and `public/videos/`.
- ✅ Preloader interaction design (progress, skip, reduced-motion, hard timeout) → React re-implementation.
- ✅ Navbar interaction design (glass, hide/show, progress bar, scroll-spy, focus-trapped mobile menu) → React re-implementation.
- ✅ Token-based CSS architecture concept (`--nav-height`, `--ease-out`, clamp() typography) → becomes Tailwind theme + CSS variables.
- ✅ Semantic/markup patterns: eyebrow labels, section rhythm, stats row, card structure.
- ✅ Full static site preserved under `legacy/` (moved verbatim, still functional) as visual reference during development.

## 10. What must be rebuilt

- ❌ Everything routed/data-driven: Next.js App Router project at repo root.
- ❌ Design tokens: replace Aurora palette with the AZUL palette from the brief.
- ❌ All layout components: new editorial/cinematic system (the static one was a first pass, not the final brand).
- ❌ No database, API, auth, booking, admin, i18n, SEO layers exist — all net-new.

## 11. Recommended architecture

See `docs/ARCHITECTURE.md` for the full document. Summary:

- **Next.js (latest stable) + App Router + TypeScript strict + Tailwind CSS + Framer Motion/GSAP + Lucide + Zod/React Hook Form**, `src/` layout.
- **MySQL/MariaDB via XAMPP + Prisma**, `DATABASE_URL` env, `azul_morocco` database, full 30-entity schema, migrations + seed.
- **Auth.js (NextAuth v5)** credentials + optional Google, JWT sessions, bcrypt, RBAC roles.
- **Cookie-based EN/FR/AR locale** with `dir="rtl"` support, JSON dictionaries + DB `Translation` table for CMS content.
- **Service layer** (`src/server/services/`) holding booking/payment business logic; API routes stay thin.
- **Payment abstraction** with `DEVELOPMENT` provider (clearly separated, no card data ever stored).
- Static prototype relocated to `legacy/`; brand assets copied to `public/brand/` + `public/videos/`.

## 12. Environment readiness checklist

| Requirement | State |
|---|---|
| Node v24.19.0 / npm 12.0.2 | ✅ |
| npm registry reachable | ✅ (PONG 506 ms) |
| XAMPP installed | ✅ `C:\xampp` |
| MariaDB 10.4.32 binaries | ✅ |
| MySQL running on 3306 | ❌ must be started (XAMPP Control Panel) |
| Brand assets | ✅ 4 logos + 1 video |
| Git | ❌ to be initialized |
