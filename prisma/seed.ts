/**
 * AZUL — MARHABA MOROCCO 2027 · seed
 * Realistic demo data. All imagery is original branded SVG placeholders
 * generated below (no copyrighted stock). All reviews are marked [DEMO].
 * Run: npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is missing — copy .env.example to .env");
const adapter = new PrismaMariaDb(dbUrl);
const prisma = new PrismaClient({ adapter });

// ---------- deterministic pseudo-random (stable across runs) ----------
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const rint = (i: number, min: number, max: number) =>
  min + Math.floor(rnd(i) * (max - min + 1));

// ---------- dates ----------
const DAY = 24 * 60 * 60 * 1000;
const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
const dateStr = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

// ---------- placeholder imagery (original, brand-generated) ----------
const PLACEHOLDER_DIR = path.join(process.cwd(), "public", "images", "placeholders");

function writePlaceholderSvg(fileName: string, label: string, eyebrow: string, accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#080808"/>
      <stop offset="0.6" stop-color="#111111"/>
      <stop offset="1" stop-color="#1a1410"/>
    </linearGradient>
    <linearGradient id="glow" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <circle cx="800" cy="180" r="380" fill="url(#glow)"/>
  <path d="M640 940 L640 460 A160 160 0 0 1 960 460 L960 940" fill="none" stroke="${accent}" stroke-width="3" opacity="0.85"/>
  <path d="M690 940 L690 500 A110 110 0 0 1 910 500 L910 940" fill="none" stroke="#F5F1E8" stroke-width="1.5" opacity="0.35"/>
  <path d="M120 940 L1480 940" stroke="#F5F1E8" stroke-width="1" opacity="0.2"/>
  <text x="800" y="470" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="92" fill="#F5F1E8" letter-spacing="4">${label}</text>
  <text x="800" y="540" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="${accent}" letter-spacing="10">${eyebrow}</text>
  <text x="800" y="985" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#F5F1E8" opacity="0.45" letter-spacing="6">AZUL · MARHABA MOROCCO 2027</text>
</svg>
`;
  fs.mkdirSync(PLACEHOLDER_DIR, { recursive: true });
  const file = path.join(PLACEHOLDER_DIR, fileName);
  fs.writeFileSync(file, svg, "utf8");
  return svg.length;
}

const SAND = "#C89B6D";
const CLAY = "#9E2F2F";
const ATLAS = "#53624D";
const IVORY = "#F5F1E8";

type Placeholder = {
  filename: string;
  label: string;
  eyebrow: string;
  accent: string;
  alt: string;
};

const PLACEHOLDERS: Placeholder[] = [
  { filename: "marrakech.svg", label: "MARRAKECH", eyebrow: "THE RED CITY", accent: CLAY, alt: "Marrakech placeholder artwork" },
  { filename: "casablanca.svg", label: "CASABLANCA", eyebrow: "ATLANTIC CAPITAL", accent: SAND, alt: "Casablanca placeholder artwork" },
  { filename: "fez.svg", label: "FEZ", eyebrow: "IMPERIAL CITY", accent: SAND, alt: "Fez placeholder artwork" },
  { filename: "chefchaouen.svg", label: "CHEFCHAOUEN", eyebrow: "THE BLUE CITY", accent: "#5B7FA6", alt: "Chefchaouen placeholder artwork" },
  { filename: "essaouira.svg", label: "ESSAOUIRA", eyebrow: "WINDY COAST", accent: IVORY, alt: "Essaouira placeholder artwork" },
  { filename: "merzouga.svg", label: "MERZOUGA", eyebrow: "SAHARA DUNES", accent: SAND, alt: "Merzouga Sahara placeholder artwork" },
  { filename: "ouarzazate.svg", label: "OUARZAZATE", eyebrow: "GATE TO THE DESERT", accent: CLAY, alt: "Ouarzazate placeholder artwork" },
  { filename: "agafay.svg", label: "AGAFAY", eyebrow: "DESERT NEAR MARRAKECH", accent: SAND, alt: "Agafay desert placeholder artwork" },
  { filename: "atlas.svg", label: "ATLAS", eyebrow: "HIGH MOUNTAINS", accent: ATLAS, alt: "Atlas mountains placeholder artwork" },
  { filename: "tangier.svg", label: "TANGIER", eyebrow: "STRAIT OF GIBRALTAR", accent: SAND, alt: "Tangier placeholder artwork" },
  { filename: "rabat.svg", label: "RABAT", eyebrow: "ROYAL CAPITAL", accent: ATLAS, alt: "Rabat placeholder artwork" },
  { filename: "sahara-trek.svg", label: "SAHARA", eyebrow: "DESERT TREK", accent: SAND, alt: "Sahara desert trek placeholder artwork" },
  { filename: "camels.svg", label: "CAMEL TREK", eyebrow: "SUNSET DUNE RIDE", accent: CLAY, alt: "Camel trek placeholder artwork" },
  { filename: "medina.svg", label: "MEDINA", eyebrow: "SOUKS & STREETS", accent: CLAY, alt: "Marrakech medina placeholder artwork" },
  { filename: "cooking.svg", label: "TAGINE", eyebrow: "MOROCCAN KITCHEN", accent: SAND, alt: "Moroccan cooking class placeholder artwork" },
  { filename: "surf.svg", label: "ATLANTIC SURF", eyebrow: "ESSAOUIRA WAVES", accent: "#5B7FA6", alt: "Surfing Essaouira placeholder artwork" },
  { filename: "quad.svg", label: "QUAD RIDE", eyebrow: "AGAFAY OFF-ROAD", accent: ATLAS, alt: "Quad biking placeholder artwork" },
  { filename: "waterfall.svg", label: "OUZOUD", eyebrow: "WATERFALLS", accent: ATLAS, alt: "Ouzoud waterfalls placeholder artwork" },
  { filename: "hassan-ii.svg", label: "HASSAN II", eyebrow: "CASABLANCA MOSQUE", accent: SAND, alt: "Hassan II mosque placeholder artwork" },
  { filename: "kasbah.svg", label: "AIT BENHADDOU", eyebrow: "UNESCO KASBAH", accent: CLAY, alt: "Ait Benhaddou placeholder artwork" },
  { filename: "todra.svg", label: "TODRA GORGE", eyebrow: "RED CANYON", accent: CLAY, alt: "Todra gorge placeholder artwork" },
  { filename: "blog.svg", label: "TRAVEL STORIES", eyebrow: "FROM THE AZUL JOURNAL", accent: SAND, alt: "Blog placeholder artwork" },
  { filename: "hero.svg", label: "MARHABA", eyebrow: "YOUR MOROCCO STARTS HERE", accent: SAND, alt: "AZUL hero artwork" },
  { filename: "avatar-demo.svg", label: "AZUL GUEST", eyebrow: "TRAVELER", accent: SAND, alt: "Demo guest avatar artwork" },
];

// ---------- helpers ----------
async function ensureMedia(filename: string, alt: string) {
  const file = path.join(PLACEHOLDER_DIR, filename);
  if (!fs.existsSync(file)) writePlaceholderSvg(filename, "AZUL", "MOROCCO", SAND);
  const stat = fs.statSync(file);
  return prisma.media.upsert({
    where: { id: `seed-media-${filename.replace(/\W/g, "-")}` },
    update: {},
    create: {
      id: `seed-media-${filename.replace(/\W/g, "-")}`,
      filename,
      path: `/images/placeholders/${filename}`,
      mimeType: "image/svg+xml",
      sizeBytes: stat.size,
      width: 1600,
      height: 1000,
      alt,
    },
  });
}

async function clearAll() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.translation.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.mediaLink.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.tripPlan.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.bookingGuest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.tourDate.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.pickupLocation.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.vehicleCategory.deleteMany();
  await prisma.guide.deleteMany();
  await prisma.media.deleteMany();
  await prisma.experienceCategory.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("→ clearing previous data…");
  await clearAll();

  // ---------- imagery ----------
  console.log("→ generating placeholder artwork…");
  const mediaMap: Record<string, string> = {};
  for (const p of PLACEHOLDERS) {
    writePlaceholderSvg(p.filename, p.label, p.eyebrow, p.accent);
    const m = await ensureMedia(p.filename, p.alt);
    mediaMap[p.filename] = m.id;
  }

  // ---------- RBAC ----------
  console.log("→ roles & permissions…");
  const permissionKeys = [
    "user:read", "user:create", "user:update", "user:delete",
    "role:read", "role:update",
    "customer:read", "customer:update",
    "guide:read", "guide:create", "guide:update",
    "vehicle:read", "vehicle:create", "vehicle:update",
    "category:read", "category:create", "category:update", "category:delete",
    "destination:read", "destination:create", "destination:update", "destination:delete",
    "experience:read", "experience:create", "experience:update", "experience:delete", "experience:publish",
    "tour:read", "tour:create", "tour:update", "tour:delete",
    "availability:read", "availability:update",
    "booking:read", "booking:create", "booking:update", "booking:cancel", "booking:delete",
    "payment:read", "payment:refund", "payment:configure",
    "coupon:read", "coupon:create", "coupon:update", "coupon:delete",
    "review:read", "review:moderate",
    "media:read", "media:create", "media:update", "media:delete",
    "blog:read", "blog:create", "blog:update", "blog:delete", "blog:publish",
    "faq:read", "faq:create", "faq:update", "faq:delete",
    "contact:read", "contact:update",
    "notification:read",
    "settings:read", "settings:update",
    "audit:read",
    "dashboard:read",
  ];
  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.create({ data: { key, description: null } })
    )
  );
  const permByKey = Object.fromEntries(permissions.map((p) => [p.key, p.id]));

  const roleDefs: {
    name: "CUSTOMER" | "GUIDE" | "STAFF" | "MANAGER" | "ADMIN" | "SUPER_ADMIN";
    description: string;
    keys: string[];
  }[] = [
    {
      name: "CUSTOMER",
      description: "Registered traveler — bookings, favorites, reviews",
      keys: ["booking:read", "booking:create", "review:read", "media:read", "faq:read", "notification:read"],
    },
    {
      name: "GUIDE",
      description: "Licensed guide — assigned tours and schedule",
      keys: ["booking:read", "tour:read", "availability:read", "guide:read", "notification:read"],
    },
    {
      name: "STAFF",
      description: "Operations — bookings and content without publishing",
      keys: [
        "dashboard:read", "booking:read", "booking:update", "booking:cancel",
        "customer:read", "experience:read", "tour:read", "availability:read",
        "review:read", "media:read", "media:create", "contact:read", "contact:update",
        "blog:read", "faq:read", "notification:read",
      ],
    },
    {
      name: "MANAGER",
      description: "Content & commercial manager — full CMS + coupons",
      keys: [
        "dashboard:read", "user:read", "customer:read", "customer:update",
        "guide:read", "guide:create", "guide:update", "vehicle:read", "vehicle:create", "vehicle:update",
        "category:read", "category:create", "category:update", "category:delete",
        "destination:read", "destination:create", "destination:update", "destination:delete",
        "experience:read", "experience:create", "experience:update", "experience:delete", "experience:publish",
        "tour:read", "tour:create", "tour:update", "tour:delete",
        "availability:read", "availability:update",
        "booking:read", "booking:update", "booking:cancel",
        "payment:read", "payment:refund",
        "coupon:read", "coupon:create", "coupon:update", "coupon:delete",
        "review:read", "review:moderate",
        "media:read", "media:create", "media:update", "media:delete",
        "blog:read", "blog:create", "blog:update", "blog:delete", "blog:publish",
        "faq:read", "faq:create", "faq:update", "faq:delete",
        "contact:read", "contact:update", "notification:read",
        "settings:read", "audit:read",
      ],
    },
    {
      name: "ADMIN",
      description: "Full platform access",
      keys: permissionKeys.filter((k) => k !== "role:read" && k !== "role:update"),
    },
    {
      name: "SUPER_ADMIN",
      description: "Everything, including roles and permissions",
      keys: permissionKeys,
    },
  ];

  const roleIds: Record<string, string> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.create({ data: { name: r.name, description: r.description } });
    roleIds[r.name] = role.id;
    await prisma.rolePermission.createMany({
      data: r.keys.map((k) => ({ roleId: role.id, permissionId: permByKey[k] })),
      skipDuplicates: true,
    });
  }

  // ---------- users ----------
  console.log("→ users (admin, staff, guides, demo customer)…");
  const admin = await prisma.user.create({
    data: {
      email: "admin@azul.ma",
      passwordHash: await bcrypt.hash("AzulAdmin!2027", 12),
      name: "AZUL Admin",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      locale: "en",
      roles: {
        create: [
          { roleId: roleIds.ADMIN },
          { roleId: roleIds.SUPER_ADMIN },
        ],
      },
    },
  });
  await prisma.user.create({
    data: {
      email: "staff@azul.ma",
      passwordHash: await bcrypt.hash("AzulStaff!2027", 12),
      name: "Imane Staff",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleIds.STAFF }] },
    },
  });
  const guideYoussef = await prisma.user.create({
    data: {
      email: "youssef@azul.ma",
      passwordHash: await bcrypt.hash("AzulGuide!2027", 12),
      name: "Youssef El Amrani",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleIds.GUIDE }] },
    },
  });
  const guideSalma = await prisma.user.create({
    data: {
      email: "salma@azul.ma",
      passwordHash: await bcrypt.hash("AzulGuide!2027", 12),
      name: "Salma Bennis",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleIds.GUIDE }] },
    },
  });
  const customerUser = await prisma.user.create({
    data: {
      email: "aisha@example.com",
      passwordHash: await bcrypt.hash("AzulDemo!2027", 12),
      name: "Aicha Benali",
      phone: "+212 661 000 111",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      locale: "en",
      roles: { create: [{ roleId: roleIds.CUSTOMER }] },
    },
  });
  const customer = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      fullName: "Aicha Benali",
      phone: "+212 661 000 111",
      country: "MA",
      city: "Casablanca",
      locale: "en",
    },
  });

  // ---------- guides / fleet ----------
  console.log("→ guides & fleet…");
  const guide1 = await prisma.guide.create({
    data: {
      userId: guideYoussef.id,
      bio: "Born in the High Atlas, Youssef has led mountain and desert journeys for 12 years and speaks four languages.",
      languages: "EN,FR,AR,BER",
      yearsExp: 12,
      licenseNumber: "MAR-GUIDE-11472",
    },
  });
  await prisma.guide.create({
    data: {
      userId: guideSalma.id,
      bio: "Salma is a cultural guide specialised in imperial cities, medinas and gastronomy — MBA turned storyteller.",
      languages: "EN,FR,AR,ES",
      yearsExp: 8,
      licenseNumber: "MAR-GUIDE-18450",
    },
  });

  const vehicleCats: Record<string, string> = {};
  for (const [slug, name] of [
    ["sedan", "Sedan"],
    ["van", "Van"],
    ["suv-4x4", "4×4 SUV"],
    ["minibus", "Minibus"],
    ["coach", "Coach"],
  ] as const) {
    const c = await prisma.vehicleCategory.create({ data: { slug, name } });
    vehicleCats[slug] = c.id;
  }
  await prisma.vehicle.createMany({
    data: [
      { categoryId: vehicleCats["suv-4x4"], guideId: guide1.id, make: "Toyota", model: "Land Cruiser", year: 2023, plate: "12345-A-6", seats: 6 },
      { categoryId: vehicleCats.van, guideId: guide1.id, make: "Mercedes", model: "Vito", year: 2022, plate: "44821-B-1", seats: 8 },
      { categoryId: vehicleCats.minibus, make: "Hyundai", model: "Solati", year: 2021, plate: "77102-A-9", seats: 15 },
      { categoryId: vehicleCats.sedan, make: "Dacia", model: "Logan", year: 2024, plate: "55914-C-3", seats: 4 },
      { categoryId: vehicleCats.coach, make: "Yutong", model: "ZK6122", year: 2020, plate: "90233-D-2", seats: 45 },
    ],
  });

  // ---------- categories ----------
  console.log("→ categories & destinations…");
  const catData: [string, string, string, string][] = [
    ["desert-adventures", "Desert & Sahara", "Nights under the stars, dunes and campfire silence.", "moon"],
    ["atlas-mountains", "Atlas Mountains", "Berber villages, high passes and snow-lined ridges.", "mountain"],
    ["cities-culture", "Cities & Culture", "Medinas, imperial cities and living heritage.", "landmark"],
    ["coast-ocean", "Coast & Ocean", "Atlantic wind, seafood and wide horizons.", "waves"],
    ["food-craft", "Food & Craft", "Markets, kitchens and artisan workshops.", "utensils"],
    ["hiking-outdoors", "Hiking & Outdoors", "Trails, gorges and waterfalls.", "footprints"],
    ["quad-camel", "Camel & Quad", "Slow dunes and fast desert tracks.", "wind"],
    ["day-trips", "Day Trips & Transfers", "Door-to-door escapes from any city.", "bus"],
  ];
  const catIds: Record<string, string> = {};
  let catPos = 0;
  for (const [slug, name, description, icon] of catData) {
    const c = await prisma.experienceCategory.create({
      data: { slug, name, description, icon, position: catPos++ },
    });
    catIds[slug] = c.id;
  }

  // 11 destinations with normalized interactive-map coordinates (Morocco bbox)
  const destData: [string, string, string, number, number, string, number, boolean][] = [
    // slug, name, region, lat, lon, shortIntro, position, featured
    ["marrakech", "Marrakech", "Marrakech-Safi", 31.63, -7.99, "The Red City — souks, palaces and the humment of Jemaa el-Fna.", 0, true],
    ["casablanca", "Casablanca", "Casablanca-Settat", 33.57, -7.59, "Morocco's Atlantic face — Art Deco streets and the Hassan II Mosque.", 1, false],
    ["fez", "Fez", "Fès-Meknès", 34.03, -5.0, "The oldest imperial city — the world's largest car-free medina.", 2, true],
    ["chefchaouen", "Chefchaouen", "Tanger-Tetouan-Al Hoceima", 35.17, -5.27, "The blue pearl of the Rif — painted walls and mountain calm.", 3, true],
    ["essaouira", "Essaouira", "Marrakech-Safi", 31.51, -9.77, "Windy Atlantic harbour of gulls, seafood and argan trees.", 4, true],
    ["merzouga", "Merzouga", "Drâa-Tafilalet", 31.1, -4.01, "Gateway to Erg Chebbi — the Sahara's tallest dunes.", 5, true],
    ["ouarzazate", "Ouarzazate", "Drâa-Tafilalet", 30.93, -6.91, "The door to the desert — kasbahs, gorges and film oases.", 6, false],
    ["agafay", "Agafay", "Marrakech-Safi", 31.42, -8.19, "Stone desert an hour from Marrakech — sunset dinners under stars.", 7, true],
    ["atlas-mountains", "Atlas", "Marrakech-Safi", 31.14, -7.92, "The great mountain spine — Imlil, Toubkal and terraced valleys.", 8, true],
    ["tangier", "Tangier", "Tanger-Tetouan-Al Hoceima", 35.76, -5.83, "Where Africa meets Europe — the Strait, the caves, the cafés.", 9, false],
    ["rabat", "Rabat", "Rabat-Salé-Kénitra", 34.02, -6.84, "The royal capital — calm boulevards and the Hassan Tower.", 10, false],
  ];
  const BBOX = { w: -13.17, e: -1.0, n: 35.93, s: 27.66 };
  const destIds: Record<string, string> = {};
  for (const [slug, name, region, lat, lon, shortIntro, position, featured] of destData) {
    const mapX = (lon - BBOX.w) / (BBOX.e - BBOX.w);
    const mapY = (BBOX.n - lat) / (BBOX.n - BBOX.s);
    const ph = PLACEHOLDERS.find((p) => p.filename.startsWith(slug.replace("atlas-mountains", "atlas").replace("-", "")));
    const d = await prisma.destination.create({
      data: {
        slug,
        name,
        region,
        country: "Morocco",
        latitude: lat,
        longitude: lon,
        mapX: Math.round(mapX * 10000) / 10000,
        mapY: Math.round(mapY * 10000) / 10000,
        shortIntro,
        description: `${shortIntro} Explore ${name} with AZUL's private guides, hand-checked routes and flexible departures.`,
        bestSeason: slug === "merzouga" || slug === "agafay" ? "Oct – Apr" : "Mar – May, Sep – Nov",
        duration: slug === "merzouga" ? "3–4 days" : "2–3 days",
        coverImageId: mediaMap[ph ? ph.filename : "hero.svg"],
        position,
        featured,
        status: "PUBLISHED",
      },
    });
    destIds[slug] = d.id;
  }

  // ---------- experiences ----------
  console.log("→ experiences…");
  type ExpDef = {
    slug: string; title: string; summary: string; description: string;
    cat: string; dest: string; ph: string;
    minutes: number; price: number; capMax: number;
    difficulty?: "EASY" | "MODERATE" | "CHALLENGING" | "DEMANDING";
    featured?: boolean; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    meeting?: string; pickupIncluded?: boolean;
    highlights: string[]; includes: string[]; excludes: string[];
    itinerary?: { day: number; title: string; description: string; duration: string }[];
  };

  const EXPS: ExpDef[] = [
    {
      slug: "agafay-desert-sunset-dinner",
      title: "Agafay Desert Sunset Dinner",
      summary: "Private sunset, live music and a candle-lit dinner in the stone desert.",
      description: "Leave Marrakech at golden hour and cross the Haouz plain to Agafay, Morocco's stone desert. Watch the sun drop behind the Atlas while mint tea is poured, then settle into a private camp for a three-course Moroccan dinner, live gnaoua music and a bonfire under an open sky.",
      cat: "desert-adventures", dest: "agafay", ph: "agafay.svg",
      minutes: 360, price: 75000, capMax: 20, featured: true,
      meeting: "Hotel/riad pickup — Marrakech",
      highlights: ["Atlas panorama at sunset", "Private candle-lit dinner", "Live gnaoua & drums", "Bonfire & stargazing"],
      includes: ["Hotel transfers", "Welcome mint tea & pastries", "3-course dinner", "Live music", "Bonfire"],
      excludes: ["Alcoholic drinks", "Gratuities"],
    },
    {
      slug: "agafay-quad-biking",
      title: "Agafay Quad Biking Adventure",
      summary: "45 minutes of off-road quad riding across Agafay's desert tracks.",
      description: "Strap in for a guided quad session through Agafay's dry riverbeds and rocky plateaus. Suitable for beginners — a full safety briefing comes first — with photo stops above the palm groves and chilled drinks at the desert café.",
      cat: "quad-camel", dest: "agafay", ph: "quad.svg",
      minutes: 180, price: 60000, capMax: 12,
      meeting: "Agafay quad base camp",
      highlights: ["45 min guided ride", "Beginner friendly", "Desert photo stop", "Hotel round-trip transfer"],
      includes: ["Quad & helmet", "Safety briefing", "Guide escort", "Water", "Transfers"],
      excludes: ["Insurance excess", "Photos package"],
    },
    {
      slug: "atlas-mountains-day-trip",
      title: "Atlas Mountains & Berber Villages Day Trip",
      summary: "Tizi n'Tichka pass, Imlil valley, waterfall walk and a Berber family lunch.",
      description: "Climb the Tizi n'Tichka pass into the High Atlas, visit the UNESCO kasbah of Aït Benhaddou and continue to Imlil for a guided walk through walnut orchards. Lunch is served in a family-run Berber house overlooking the peaks.",
      cat: "atlas-mountains", dest: "atlas-mountains", ph: "atlas.svg",
      minutes: 480, price: 65000, capMax: 14, featured: true,
      meeting: "Hotel/riad pickup — Marrakech",
      highlights: ["Aït Benhaddou kasbah", "Imlil valley walk", "Family-run Berber lunch", "Return by evening"],
      includes: ["Private 4×4 & driver", "Licensed guide", "Lunch & tea", "All entrance fees"],
      excludes: ["Personal purchases", "Tips"],
    },
    {
      slug: "atlas-lakes-trek",
      title: "Atlas Lakes Day Trek",
      summary: "A full-day high trail to turquoise lakes above Imlil.",
      description: "One of the most rewarding single-day hikes in Morocco: climb steadily through juniper forest to a chain of glacial lakes sitting at 2,800 m, with Toubkal's summit often in view. Moderate to challenging, rewarded with a mountain picnic.",
      cat: "hiking-outdoors", dest: "atlas-mountains", ph: "atlas.svg",
      minutes: 540, price: 85000, capMax: 10, difficulty: "CHALLENGING",
      meeting: "Imlil village square",
      highlights: ["Glacial lakes at 2,800 m", "Picnic with Atlas views", "Small groups", "Mountain guide"],
      includes: ["Mountain guide", "Hotel transfers", "Picnic lunch", "Walking sticks"],
      excludes: ["Hiking boots rental", "Horse mule"],
    },
    {
      slug: "marrakech-medina-souks",
      title: "Marrakech Medina & Souks Walking Tour",
      summary: "Hidden riads, spice lanes and the stories behind Jemaa el-Fna.",
      description: "Three hours on foot through the living maze: Koubba el-Baadiyin, the dyers' souk, the tanneries and a carpet workshop, finishing at the lantern square. Your guide threads in history, etiquette and the art of the friendly bargained tea.",
      cat: "cities-culture", dest: "marrakech", ph: "medina.svg",
      minutes: 180, price: 40000, capMax: 10, featured: true,
      meeting: "Koutoubia main gate, Marrakech",
      highlights: ["Medina hidden courtyards", "Spice & lantern souks", "Mint tea stop", "Small group max 10"],
      includes: ["Licensed guide", "Mint tea", "All medina entries"],
      excludes: ["Shopping", "Tips"],
    },
    {
      slug: "marrakech-cooking-class",
      title: "Marrakech Cooking Class & Market Visit",
      summary: "Shop the souk, then cook tagine, preserved lemon and mint tea.",
      description: "Start at a neighbourhood market with a local cook to choose produce and spices, then return to a traditional riad kitchen. Learn three recipes by hand — tagine, zaalouk and chebakia — and sit down to eat everything you made.",
      cat: "food-craft", dest: "marrakech", ph: "cooking.svg",
      minutes: 240, price: 55000, capMax: 12,
      meeting: "Riad kitchen — Medina",
      highlights: ["Market shopping", "Cook 3 recipes", "Full lunch included", "Recipe cards to keep"],
      includes: ["Market visit", "Cooking session", "Lunch", "Non-alcoholic drinks"],
      excludes: ["Alcohol", "Transport"],
    },
    {
      slug: "moroccan-hammam-spa",
      title: "Traditional Hammam & Gommage Spa",
      summary: "Private steam, black soap scrub and argan oil massage.",
      description: "Ninety minutes of pure ritual in a private hammam: warm steam, savon beldi and a kessa glove exfoliation, followed by a rhassoul clay mask and an argan oil massage — the way Moroccans have done it for centuries.",
      cat: "food-craft", dest: "marrakech", ph: "medina.svg",
      minutes: 120, price: 50000, capMax: 4,
      meeting: "Hammam — Gueliz or Medina",
      highlights: ["Private cabin", "Black soap & kessa scrub", "Rhassoul mask", "Argan massage"],
      includes: ["All treatments", "Robe & towels", "Herbal tea"],
      excludes: ["Tips"],
    },
    {
      slug: "sahara-merzouga-3-day-tour",
      title: "3-Day Sahara Tour: Merzouga Camel Trek & Camp",
      summary: "Dades gorges, Todra canyon, camel trek and a luxury desert camp.",
      description: "The classic southern loop done properly: cross the High Atlas via Tizi n'Tichka, break the journey in Ouarzazate and the Dades Valley, walk the colossal walls of Todra Gorge, then ride camels into Erg Chebbi for a night in a private desert camp with dinner and drums.",
      cat: "desert-adventures", dest: "merzouga", ph: "sahara-trek.svg",
      minutes: 4320, price: 240000, capMax: 12, featured: true,
      itinerary: [
        { day: 1, title: "Marrakech → Dades Valley", description: "Tizi n'Tichka pass, Aït Benhaddou, Ouarzazate and the Dades gorges. Dinner and night in a kasbah hotel.", duration: "9 h driving + visits" },
        { day: 2, title: "Todra Gorge → Merzouga", description: "Walk Todra's 300 m canyon walls, continue via Erfoud to Merzouga, ride camels to the camp for sunset and dinner under the stars.", duration: "6 h driving + camel trek" },
        { day: 3, title: "Dunes → Marrakech", description: "Sunrise on the dunes, breakfast in the desert, return via the Atlas and Rissani. Arrive Marrakech by evening.", duration: "9 h driving + sunrise walk" },
      ],
      meeting: "Hotel/riad pickup — Marrakech",
      highlights: ["Erg Chebbi sunset camel trek", "Todra Gorge walk", "2 nights in kasbah & desert camp", "All transport in private vehicle"],
      includes: ["2 breakfasts, 2 dinners", "3 days private 4×4", "English/Spanish driver-guide", "Camel trek & camp night"],
      excludes: ["Lunches", "Drinks at hotels", "Tips"],
    },
    {
      slug: "camel-trek-sunset",
      title: "Sunset Camel Trek in Erg Chebbi",
      summary: "Two hours on dromedaries to a dune camp with tea and drums.",
      description: "Ride the caravan rhythm into Erg Chebbi as the light turns copper — about two hours out and back, with a stop on the highest dune for mint tea before the sunset call to prayer.",
      cat: "quad-camel", dest: "merzouga", ph: "camels.svg",
      minutes: 150, price: 35000, capMax: 16,
      meeting: "Merzouga dromedary base",
      highlights: ["2 h camel ride", "Dune sunset", "Mint tea at camp", "Local caravan guides"],
      includes: ["Camel & guide", "Tea", "Sunset stop"],
      excludes: ["Dinner at camp", "Tips"],
    },
    {
      slug: "essaouira-coastal-escape",
      title: "Essaouira Coastal Escape from Marrakech",
      summary: "Windy ramparts, seafood lunch and a walk among the gulls.",
      description: "Escape the heat to the Atlantic — the fortified port of Essaouira, blue shutters and gulls circling the harbour. Explore the ramparts, taste grilled sardines by the marina and wander the artisan streets at your own pace.",
      cat: "coast-ocean", dest: "essaouira", ph: "essaouira.svg",
      minutes: 540, price: 70000, capMax: 14, featured: true,
      meeting: "Hotel/riad pickup — Marrakech",
      highlights: ["UNESCO medina & ramparts", "Fresh seafood lunch", "Essaouira–Mogador views", "Private or shared option"],
      includes: ["Round-trip transfer", "Driver-guide", "Walking tour"],
      excludes: ["Lunch", "Shopping"],
    },
    {
      slug: "essaouira-surf-lesson",
      title: "Essaouira Surf Lesson on the Atlantic",
      summary: "Two-hour beginner lesson with board, wetsuit and coaching.",
      description: "Essaouira's beach break is one of the friendliest places in Morocco to stand up for the first time. Two hours with an ISA-certified coach, all gear included, tide and safety briefing first.",
      cat: "coast-ocean", dest: "essaouira", ph: "surf.svg",
      minutes: 150, price: 45000, capMax: 8, difficulty: "EASY",
      meeting: "Essaouira beach — surf club",
      highlights: ["ISA-certified coach", "Board & wetsuit included", "Beach warm-up", "Photos on the water"],
      includes: ["Equipment", "Coach", "Insurance"],
      excludes: ["Transport"],
    },
    {
      slug: "chefchaouen-blue-city-day-trip",
      title: "Chefchaouen Blue City Day Trip from Tangier",
      summary: "The Rif's blue medina, Ras El Maa waterfall and local lunch.",
      description: "Climb into the Rif to Morocco's most photogenic town — every wall washed in shades of blue. A guided loop covers the Ras El Maa springs, the Spanish Mosque viewpoint and the medina's artisan alleys, with time for a slow Andalusian lunch.",
      cat: "cities-culture", dest: "chefchaouen", ph: "chefchaouen.svg",
      minutes: 600, price: 80000, capMax: 12, featured: true,
      meeting: "Tangier hotel / port pickup",
      highlights: ["Rif mountain drive", "Blue medina walk", "Spanish Mosque viewpoint", "Lunch in a courtyard café"],
      includes: ["Private transport", "Licensed guide", "Bottled water"],
      excludes: ["Lunch", "Tips"],
    },
    {
      slug: "ait-benhaddou-ouarzazate-day-trip",
      title: "Aït Benhaddou & Ouarzazate Day Trip",
      summary: "The famous ksar, Atlas studios and the road of a thousand kasbahs.",
      description: "Cross the Tizi n'Tichka pass to the UNESCO ksar of Aït Benhaddou, then visit the movie studios and Taourirt kasbah in Ouarzazate before returning to Marrakech at sunset.",
      cat: "day-trips", dest: "ouarzazate", ph: "kasbah.svg",
      minutes: 600, price: 75000, capMax: 14,
      meeting: "Hotel/riad pickup — Marrakech",
      highlights: ["UNESCO Aït Benhaddou", "Atlas film studios", "Taourirt kasbah", "Tizi n'Tichka pass"],
      includes: ["Private transport", "Licensed guide", "Entrance fees"],
      excludes: ["Lunch", "Tips"],
    },
    {
      slug: "todra-gorge-day-trip",
      title: "Todra Gorge Canyon Day Trip",
      summary: "Walk beneath 300 m red walls where the river narrows to the light.",
      description: "A full day among the Gorges of the south — from Tinghir's palm grove into the narrowing canyon, where Berber guides and climbers pause under sheer 300-metre limestone walls. Draft route — publishes after road conditions are confirmed.",
      cat: "hiking-outdoors", dest: "merzouga", ph: "todra.svg",
      minutes: 600, price: 85000, capMax: 10, status: "DRAFT",
      meeting: "Tinghir, main square",
      highlights: ["300 m canyon walls", "Palm grove walk", "Riverbed path"],
      includes: ["4×4 transport", "Local guide"],
      excludes: ["Lunch"],
    },
    {
      slug: "ouzoud-waterfalls-trip",
      title: "Ouzoud Waterfalls Day Trip",
      summary: "110 m cascades, olive terraces and Barbary macaques.",
      description: "Escape east into the Middle Atlas foothills to the Ouzoud waterfalls — 110 metres of white water falling into a turquoise basin. Boat to the foot of the falls, walk the olive terraces and keep an eye out for the resident macaques.",
      cat: "day-trips", dest: "marrakech", ph: "waterfall.svg",
      minutes: 480, price: 60000, capMax: 16,
      meeting: "Hotel/riad pickup — Marrakech",
      highlights: ["110 m waterfalls", "Boat at the base", "Olive terrace walk", "Barbary macaques"],
      includes: ["Round-trip transfer", "Local guide", "Boat ride"],
      excludes: ["Lunch", "Tips"],
    },
    {
      slug: "casablanca-hassan-ii-mosque",
      title: "Casablanca & Hassan II Mosque Day from Marrakech",
      summary: "Morocco's largest mosque, Corniche waves and Art Deco downtown.",
      description: "A full day to the economic capital: guided visit of the Hassan II Mosque — one of the few in Morocco open to non-Muslims — then the Corniche, Rick's Café terrace and Art Deco Habous quarter.",
      cat: "day-trips", dest: "casablanca", ph: "hassan-ii.svg",
      minutes: 600, price: 65000, capMax: 14,
      meeting: "Hotel/riad pickup — Marrakech",
      highlights: ["Hassan II Mosque", "Corniche & Old Medina", "Habous quarter", "Lunch by the sea"],
      includes: ["Round-trip transport", "Mosque entry & guide"],
      excludes: ["Lunch", "Tips"],
    },
    {
      slug: "fez-cultural-immersion",
      title: "Fez Cultural Immersion Day",
      summary: "9,000 alleys, the tanneries, Al-Qarawiyyin and a family dinner table.",
      description: "Drive to Fez and enter the world's largest living medina with a historian guide — Chouara tannery terraces, madrasa zellige, the old mellah — ending with a Moroccan family dinner in a restored fondouk.",
      cat: "cities-culture", dest: "fez", ph: "medina.svg",
      minutes: 600, price: 90000, capMax: 10, featured: false,
      meeting: "Fez railway station pickup",
      highlights: ["Chouara tannery", "Al-Qarawiyyin exterior", "Madrasa Bou Inania", "Family dinner"],
      includes: ["Driver from Marrakech (shared)", "Historian guide", "Dinner"],
      excludes: ["Lunch", "Tips"],
    },
    {
      slug: "rabat-capital-heritage",
      title: "Rabat Capital Heritage Day Trip",
      summary: "Hassan Tower, Kasbah of the Udayas and the royal boulevards.",
      description: "Discover the administrative heart of Morocco — the unfinished 12th-century Hassan Tower, the blue-washed Kasbah of the Udayas, Mohammed V's mausoleum and a slow walk along the Bouregreg. Draft route awaiting 2027 opening hours confirmation.",
      cat: "day-trips", dest: "rabat", ph: "rabat.svg",
      minutes: 540, price: 70000, capMax: 14, status: "DRAFT",
      meeting: "Casablanca or Rabat hotel pickup",
      highlights: ["Hassan Tower", "Kasbah of the Udayas", "Royal mausoleum"],
      includes: ["Private transport", "Licensed guide"],
      excludes: ["Lunch"],
    },
  ];

  const expIds: Record<string, string> = {};
  for (let i = 0; i < EXPS.length; i++) {
    const e = EXPS[i];
    const exp = await prisma.experience.create({
      data: {
        slug: e.slug,
        title: e.title,
        summary: e.summary,
        description: e.description,
        categoryId: catIds[e.cat],
        destinationId: destIds[e.dest],
        durationMinutes: e.minutes,
        priceMinor: e.price,
        capacityMin: 1,
        capacityMax: e.capMax,
        difficulty: e.difficulty ?? "MODERATE",
        status: e.status ?? "PUBLISHED",
        featured: e.featured ?? false,
        meetingPoint: e.meeting ?? null,
        pickupIncluded: e.pickupIncluded ?? true,
        pickupNotes: e.pickupIncluded === false ? null : "Complimentary hotel/riad pickup within city limits.",
        highlights: e.highlights,
        includes: e.includes,
        excludes: e.excludes,
        itinerary: e.itinerary ?? undefined,
        cancelWindowHours: 48,
        minBookingNoticeHours: 24,
        coverImageId: mediaMap[e.ph],
        ratingAvg: e.status === "DRAFT" ? 0 : Math.round((4 + rnd(i) * 1) * 10) / 10,
        ratingCount: e.status === "DRAFT" ? 0 : rint(i + 40, 8, 64),
        bookingCount: e.status === "DRAFT" ? 0 : rint(i + 70, 30, 320),
        seoTitle: `${e.title} | AZUL Morocco`,
        seoDescription: e.summary,
      },
    });
    expIds[e.slug] = exp.id;
  }

  // gallery for featured experiences (4 shared scenes each)
  const galleryScenes = ["marrakech.svg", "atlas.svg", "medina.svg", "hero.svg"];
  for (const slug of ["agafay-desert-sunset-dinner", "sahara-merzouga-3-day-tour", "atlas-mountains-day-trip", "essaouira-coastal-escape"]) {
    let pos = 0;
    for (const f of galleryScenes) {
      await prisma.gallery.create({
        data: { mediaId: mediaMap[f], experienceId: expIds[slug], position: pos++ },
      });
    }
  }

  // ---------- availability (90 days) ----------
  console.log("→ availability (next 90 days)…");
  const publishedExpIds = Object.values(expIds);
  let availCount = 0;
  for (let e = 0; e < publishedExpIds.length; e++) {
    const cap = EXPS[e].status === "DRAFT" ? 0 : Math.min(EXPS[e].capMax, 12);
    for (let d = 0; d < 90; d++) {
      const date = addDays(startOfToday, d);
      const closed = date.getUTCDay() === 1; // closed Mondays
      await prisma.availability.create({
        data: {
          experienceId: publishedExpIds[e],
          date: new Date(dateStr(date)),
          capacityTotal: cap,
          capacityBooked: closed || cap === 0 ? 0 : rint(e * 97 + d, 0, Math.max(0, Math.floor(cap * 0.6))),
          closed,
        },
      });
      availCount++;
    }
  }

  // ---------- tours & tour dates (2027 season) ----------
  console.log("→ tours & 2027 dates…");
  const tourDefs: { slug: string; title: string; desc: string; expSlug: string; price: number; cap: number }[] = [
    { slug: "sahara-desert-tour-2027", title: "Sahara Desert Tour — 2027 Departures", desc: "The 3-day Merzouga loop with scheduled group departures every two weeks during the 2027 season.", expSlug: "sahara-merzouga-3-day-tour", price: 240000, cap: 12 },
    { slug: "atlas-lakes-trek-2027", title: "Atlas Lakes Trek — 2027 Season", desc: "Scheduled guided treks to the high lakes above Imlil, spring through autumn.", expSlug: "atlas-lakes-trek", price: 85000, cap: 10 },
    { slug: "essaouira-coast-tour-2027", title: "Essaouira Coastal Escape — 2027", desc: "Weekly combined departures from Marrakech to the Atlantic port.", expSlug: "essaouira-coastal-escape", price: 70000, cap: 14 },
    { slug: "north-heritage-tour-2027", title: "North Heritage: Chefchaouen & Fez", desc: "Two-day northern loop through the Rif and the imperial medina.", expSlug: "chefchaouen-blue-city-day-trip", price: 160000, cap: 12 },
  ];
  let dateIdx = 0;
  for (const t of tourDefs) {
    const tour = await prisma.tour.create({
      data: {
        slug: t.slug,
        title: t.title,
        description: t.desc,
        experienceId: expIds[t.expSlug],
        destinationId: destIds[
          t.expSlug === "essaouira-coastal-escape"
            ? "essaouira"
            : t.expSlug === "chefchaouen-blue-city-day-trip"
              ? "chefchaouen"
              : t.expSlug === "atlas-lakes-trek"
                ? "atlas-mountains"
                : "merzouga"
        ],
        status: "PUBLISHED",
        priceMinor: t.price,
        capacity: t.cap,
        coverImageId: mediaMap[EXPS.find((x) => x.slug === t.expSlug)!.ph],
      },
    });
    for (let k = 0; k < 10; k++) {
      const date = addDays(new Date(Date.UTC(2027, 0, 15)), k * 14);
      await prisma.tourDate.create({
        data: {
          tourId: tour.id,
          date,
          startTime: new Date(date.setHours(8, 0, 0, 0)),
          capacityTotal: t.cap,
          capacityBooked: rint(dateIdx++, 2, Math.floor(t.cap * 0.7)),
          status: "PUBLISHED",
        },
      });
    }
  }

  // ---------- pickup locations ----------
  console.log("→ pickup locations…");
  const pickDefs: [string, string, string, number | null, number | null][] = [
    ["Menara Airport (RAK)", "Marrakech Menara Airport arrivals hall", "Marrakech", 31.6069, -8.0363],
    ["Marrakech Medina", "Hotels & riads inside the old city walls", "Marrakech", 31.6295, -7.9811],
    ["Guéliz — City Centre", "Boulevard Mohammed V & Hivernage hotels", "Marrakech", 31.634, -8.0088],
    ["Casablanca Airport (CMN)", "Mohammed V International arrivals", "Casablanca", 33.3675, -7.5898],
    ["Essaouira Medina", "Bab Marrakech gate & harbour hotels", "Essaouira", 31.5085, -9.7595],
    ["Imlil Village", "Imlil square, Atlas trailhead", "Atlas", 31.1358, -7.9194],
  ];
  const pickIds: string[] = [];
  let pickPos = 0;
  for (const [name, description, city, lat, lon] of pickDefs) {
    const p = await prisma.pickupLocation.create({
      data: { name, description: `${city} — ${description}`, address: city, latitude: lat, longitude: lon, position: pickPos++, active: true },
    });
    pickIds.push(p.id);
  }

  // ---------- coupons ----------
  console.log("→ coupons…");
  await prisma.coupon.create({
    data: { code: "AZUL10", description: "10% off any booked experience — launch promotion", percentOff: 10, redemptionLimit: 500, active: true },
  });
  await prisma.coupon.create({
    data: { code: "WELCOME5", description: "50 MAD off your first booking", fixedOffMinor: 5000, redemptionLimit: 1000, active: true },
  });

  // ---------- demo booking (completed, reviewed) ----------
  console.log("→ demo booking AZL-2027-000001…");
  const bookingDate = new Date(Date.UTC(2026, 8, 20)); // 2026-09-20 (past)
  const expDemo = EXPS.find((x) => x.slug === "agafay-desert-sunset-dinner")!;
  const booking = await prisma.booking.create({
    data: {
      reference: "AZL-2027-000001",
      customerId: customer.id,
      experienceId: expIds[expDemo.slug],
      status: "COMPLETED",
      mode: "PRIVATE",
      date: bookingDate,
      guests: 2,
      adults: 2,
      children: 0,
      pickupLocationId: pickIds[1],
      pickupAddress: "Riad Yasmine, Medina Marrakech",
      specialRequests: "Anniversary dinner — a quiet table if possible.",
      subtotalMinor: expDemo.price * 2,
      discountMinor: 0,
      taxMinor: Math.round(expDemo.price * 2 * 0.1),
      totalMinor: expDemo.price * 2 + Math.round(expDemo.price * 2 * 0.1),
      confirmedAt: new Date(Date.UTC(2026, 8, 15)),
      completedAt: new Date(Date.UTC(2026, 8, 21)),
      guideId: guide1.id,
      createdAt: new Date(Date.UTC(2026, 8, 10)),
    },
  });
  await prisma.bookingItem.create({
    data: {
      bookingId: booking.id,
      label: "Agafay Desert Sunset Dinner × 2",
      quantity: 2,
      unitPriceMinor: expDemo.price,
      totalMinor: expDemo.price * 2,
    },
  });
  await prisma.bookingGuest.createMany({
    data: [
      { bookingId: booking.id, firstName: "Aicha", lastName: "Benali", isLead: true, ageGroup: "ADULT" },
      { bookingId: booking.id, firstName: "Karim", lastName: "Benali", isLead: false, ageGroup: "ADULT" },
    ],
  });
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: "DEVELOPMENT",
      providerRef: "DEV-TEST-0001",
      amountMinor: booking.totalMinor,
      currency: "MAD",
      status: "PAID",
      mode: "DEVELOPMENT",
      paidAt: new Date(Date.UTC(2026, 8, 10)),
    },
  });

  // ---------- reviews (all marked DEMO) ----------
  console.log("→ demo reviews…");
  const reviewDefs: [string, number, string, string][] = [
    ["agafay-desert-sunset-dinner", 5, "Sunset we will never forget", "[DEMO] Our driver arrived exactly on time, the camp was stunning and the music after dinner was the highlight of our whole trip."],
    ["atlas-mountains-day-trip", 5, "Perfectly organised day in the Atlas", "[DEMO] Lunch with a Berber family felt genuine, not staged. Our guide explained everything without rushing us."],
    ["marrakech-medina-souks", 4, "Great orientation to the medina", "[DEMO] Three hours flew by. We could never have found the dyers' souk alone. Wear comfortable shoes!"],
    ["sahara-merzouga-3-day-tour", 5, "The Sahara delivered", "[DEMO] Camel trek at sunset, drums at the camp, sunrise on the dunes — worth every dirham. Hotels were clean and characterful."],
    ["essaouira-coastal-escape", 5, "Loved the Atlantic air", "[DEMO] A welcome break from Marrakech's heat. Seafood by the marina was excellent and the pace was relaxed."],
    ["marrakech-cooking-class", 4, "Hands-on and delicious", "[DEMO] Market visit was chaotic in the best way. We still make the tagine at home. Slightly rushed at the end."],
    ["camel-trek-sunset", 5, "Short but magical", "[DEMO] Two hours felt like ten minutes. The guides took beautiful photos for us without being asked."],
    ["chefchaouen-blue-city-day-trip", 5, "Blue city magic", "[DEMO] The Rif road itself is worth the trip. Our guide knew every quiet corner for photos."],
    ["agafay-quad-biking", 4, "Adrenaline near Marrakech", "[DEMO] Good briefing, safe gear. Would have liked a longer ride — we booked the 45 minute slot."],
    ["atlas-lakes-trek", 5, "Legs burned, soul full", "[DEMO] Challenging ascent but the lakes are unreal. Guide kept the group together and on schedule."],
    ["ait-benhaddou-ouarzazate-day-trip", 4, "Film history and kasbahs", "[DEMO] Aït Benhaddou is as impressive as it looks on screen. Long day but worth it."],
    ["ouzoud-waterfalls-trip", 5, "Beautiful easy day out", "[DEMO] The boat at the base of the falls was a lovely surprise. Macaques stole our oranges though!"],
    ["moroccan-hammam-spa", 5, "Proper traditional hammam", "[DEMO] The scrub was intense in the best way. Left feeling newborn. Private cabin was spotless."],
    ["casablanca-hassan-ii-mosque", 4, "Stunning mosque", "[DEMO] Hassan II mosque is breathtaking. The rest of Casablanca is a bit sleepier than expected but the day was well guided."],
  ];
  // first review is attached to the completed demo booking
  for (let i = 0; i < reviewDefs.length; i++) {
    const [slug, rating, title, body] = reviewDefs[i];
    const exp = EXPS.find((x) => x.slug === slug)!;
    if (exp.status === "DRAFT") continue;
    let reviewCustomerId = customer.id;
    if (i > 0) {
      const reviewer = await prisma.user.create({
        data: {
          email: `reviewer${i + 1}@example.com`,
          passwordHash: await bcrypt.hash("Review!2027", 12),
          name: `Demo Traveler ${i + 1}`,
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
          roles: { create: [{ roleId: roleIds.CUSTOMER }] },
        },
      });
      const reviewerCustomer = await prisma.customer.create({
        data: { userId: reviewer.id, fullName: `Demo Traveler ${i + 1}`, locale: "en" },
      });
      reviewCustomerId = reviewerCustomer.id;
    }
    await prisma.review.create({
      data: {
        customerId: reviewCustomerId,
        experienceId: expIds[slug],
        bookingId: i === 0 ? booking.id : null,
        rating,
        title,
        body,
        status: i % 5 === 4 ? "PENDING" : "APPROVED",
        helpfulCount: rint(i * 13, 0, 9),
      },
    });
  }

  // ---------- favorites ----------
  console.log("→ favorites…");
  for (const slug of ["sahara-merzouga-3-day-tour", "essaouira-coastal-escape", "marrakech-cooking-class"]) {
    await prisma.favorite.create({
      data: { userId: customerUser.id, experienceId: expIds[slug] },
    });
  }

  // ---------- blog ----------
  console.log("→ blog…");
  const blogCats: Record<string, string> = {};
  for (const [slug, name] of [["guides", "Destination Guides"], ["planning", "Trip Planning"], ["culture", "Culture & Food"], ["news", "AZUL News"]] as const) {
    const c = await prisma.blogCategory.create({ data: { slug, name } });
    blogCats[slug] = c.id;
  }
  const posts: [string, string, string, string, string, "PUBLISHED" | "DRAFT", Date][] = [
    [
      "when-to-visit-morocco",
      "When to Visit Morocco: A Month-by-Month Guide",
      "Spring and autumn are the classics — but the coast, the Atlas and the Sahara each have their own perfect window.",
      "guides",
      `# When to visit Morocco\n\nMorocco is not one climate but four: Atlantic coast, mountain, plain and deep desert. The sweet spots:\n\n## March – May\nWildflowers in the Atlas, comfortable medina walks (18–25 °C), full waterfalls at Ouzoud. The best all-round window.\n\n## June – August\nHot inland (35–45 °C in Marrakech) — head for Essaouira or the coast. Sahara nights are warm but spectacular.\n\n## September – November\nShoulder season with summer light. Dunes cool down, desert camps are at their finest, hotels are quieter.\n\n## December – February\nSnow on the High Atlas, crisp clear days, coolest desert nights (pack layers for camp). Perfect for hammams.\n\n**AZUL tip:** book Agafay and Atlas trips 2–3 weeks ahead in spring; Marrakech day trips year-round are easy.`,
      "PUBLISHED",
      new Date(Date.UTC(2026, 8, 12)),
    ],
    [
      "agafay-vs-sahara",
      "Agafay vs Sahara: Which Desert Is Right for You?",
      "Both are dramatic — only one takes six hours. How to choose between Morocco's stone desert and its golden dunes.",
      "guides",
      `# Agafay vs Sahara\n\n## Agafay — the desert on your doorstep\nOne hour from Marrakech. A lunar stone desert with Atlas views, perfect for a sunset dinner or quad session when time is short. Choose Agafay if you have half a day.\n\n## Merzouga & Erg Chebbi — the real dunes\nSix hours of driving to a 150-metre golden sea. Overnight camel camp, silence, stars. Choose the Sahara if you have 2–3 days and want the iconic experience.\n\n## Can't decide?\nDo Agafay on arrival night to shake off the flight, and keep the Sahara for the south loop. AZUL runs both daily.`,
      "PUBLISHED",
      new Date(Date.UTC(2026, 8, 20)),
    ],
    [
      "first-time-marrakech",
      "First Time in Marrakech? 10 Things to Know",
      "From bargaining rhythm to prayer-time pauses — the practical knowledge locals wish every visitor had.",
      "planning",
      `# First time in Marrakech?\n\n1. **The medina runs on foot.** Wear shoes you can walk 15,000 steps in.\n2. **Bargain with a smile.** Start at ~60% of the ask, keep it friendly, walk away if needed.\n3. **Carry small cash.** ATMs exist in Gueliz; the medina prefers dirhams.\n4. **Friday mornings are quiet.** Prayers close many shops briefly.\n5. **Jemaa el-Fna after 18:00** is the show — arrive hungry.\n6. **Ask before photos** of food stalls and performers.\n7. **Mint tea is an invitation**, not a bill — unless it is a menu item.\n8. **Taxis:** agree the meter or price before boarding.\n9. **Dress respectfully** when visiting mosques (exterior only for non-Muslims).\n10. **Book the desert early.** Our Agafay sunsets sell out on weekends.`,
      "PUBLISHED",
      new Date(Date.UTC(2026, 8, 28)),
    ],
    [
      "moroccan-food-must-try",
      "Moroccan Food: The Dishes You Must Try",
      "Tagine is only the beginning — pastilla, msemen, harira and the rituals around them.",
      "culture",
      `# Moroccan food worth planning a trip around\n\n**Tagine** — the slow-cooked cone-pot stew; lamb with prunes and almonds is the classic.\n\n**Pastilla** — flaky pie of pigeon (or chicken) dusted with cinnamon and sugar. Sweet-savoury magic.\n\n**Harira** — the tomato-lentil soup that breaks every Ramadan fast.\n\n**Msemen** — layered flatbread, folded and griddled; eat it hot with honey and amlou.\n\n**Fresh-squeezed orange juice** at Jemaa el-Fna: one dirham per glass, the country's best deal.\n\nTake our Marrakech cooking class and you will make tagine, zaalouk and chebakia yourself.`,
      "PUBLISHED",
      new Date(Date.UTC(2026, 9, 1)),
    ],
    [
      "how-our-day-trips-work",
      "How AZUL Day Trips Work (2027 Edition)",
      "Pickup windows, private vs shared, cancellation rules — everything behind a confirmed AZL reference.",
      "news",
      `# How our day trips work\n\nEvery booking receives an **AZL-2027-XXXXXX** reference immediately after payment. Your voucher and driver details arrive by email within minutes.\n\n**Pickup:** we collect you from your hotel or riad inside the city limits, free of charge, within a 30-minute window.\n\n**Private vs group:** every experience can run privately for your group, or join a scheduled departure on selected dates.\n\n**Cancellation:** free cancellation up to 48 hours before departure, no questions asked.\n\n*Coming soon: live driver tracking.*`,
      "PUBLISHED",
      new Date(Date.UTC(2026, 9, 5)),
    ],
    [
      "winter-in-the-atlas",
      "Winter in the Atlas: Snow, Tea and Toubkal",
      "A draft look at cold-season trekking and the villages that shine in January light.",
      "guides",
      `# Winter in the Atlas (draft)\n\nDecember to February brings snow to the high villages and crystalline skies over Toubkal...\n\n*Article still in draft — pending guide safety review for high passes.*`,
      "DRAFT",
      new Date(Date.UTC(2026, 9, 6)),
    ],
  ];
  for (const [slug, title, excerpt, cat, body, status, publishedAt] of posts) {
    await prisma.blogPost.create({
      data: {
        slug,
        title,
        excerpt,
        body,
        categoryId: blogCats[cat],
        authorName: "AZUL Editorial",
        status,
        publishedAt: status === "PUBLISHED" ? publishedAt : null,
        readingMinutes: Math.max(3, Math.round(body.split(/\s+/).length / 200)),
        coverImageId: mediaMap["blog.svg"],
        seoTitle: `${title} | AZUL Morocco Journal`,
        seoDescription: excerpt,
      },
    });
  }

  // ---------- FAQ ----------
  console.log("→ FAQs…");
  const faqDefs: [string, string, string][] = [
    ["Booking", "How do I know my booking is confirmed?", "You receive an AZL-2027-XXXXXX reference immediately after payment. Our operations team confirms by email within a few hours, with driver and voucher details attached."],
    ["Booking", "Can I book a private experience instead of a group?", "Yes. Every experience can run privately for your group — select PRIVATE during booking. Private departures run on the date you choose."],
    ["Payment", "Is payment secure?", "Yes. Card details are handled entirely by the payment provider — AZUL never sees or stores card numbers. In DEMO mode, payments are simulated and no charge occurs."],
    ["Payment", "Which payment methods do you accept?", "Online card payments plus cash on departure for selected experiences (shown at checkout where available). Prices are in Moroccan dirham (MAD)."],
    ["Cancellation", "What is your cancellation policy?", "Free cancellation up to 48 hours before the experience start time (24 hours for some tours — shown on each experience page). After that, the full amount is retained."],
    ["Pickup", "Where will you pick me up?", "Complimentary pickup from hotels and riads inside the medina or city centre. Airport pickups and outer zones are arranged during booking — or choose a pickup point from the list."],
    ["Tours", "What happens if it rains?", "Desert trips still run in light rain; trekking may be replaced with an alternative of equal value or fully refunded. We contact you by phone and email the morning of."],
    ["General", "Are children welcome?", "Yes — most experiences welcome children over 5. Under-5s travel free on private bookings; child pricing is applied automatically where relevant."],
    ["General", "Which languages do guides speak?", "Our guides work in English, French, Arabic and German, with Spanish and Dutch on request. Select your language at booking."],
    ["Reviews", "Are reviews on this site verified?", "Yes — only customers with a completed booking can leave a review. Reviews marked [DEMO] are seeded demonstration content during development."],
  ];
  let faqPos = 0;
  const faqIds: string[] = [];
  for (const [category, question, answer] of faqDefs) {
    const f = await prisma.faq.create({ data: { category, question, answer, position: faqPos++ } });
    faqIds.push(f.id);
  }
  const faqChildrenId = faqIds[faqDefs.findIndex((f) => f[1].startsWith("Are children"))];

  // ---------- contact messages ----------
  console.log("→ contact messages…");
  await prisma.contactMessage.createMany({
    data: [
      { name: "Laura Meyer", email: "laura.meyer@example.de", subject: "Private group of 8 — October 2027", message: "Hello AZUL, we are a family of 8 (2 children) planning 10 days in Morocco in October 2027. Could you propose a private driver for the Marrakech–Merzouga loop? Best, Laura", locale: "en", status: "NEW" },
      { name: "Thomas Petit", email: "thomas.petit@example.fr", subject: "Question sur l'Agafay", message: "Bonjour, la dînette au coucher du soleil est-elle disponible les vendredis soirs en décembre ? Merci !", locale: "fr", status: "NEW" },
    ],
  });

  // ---------- settings ----------
  console.log("→ site settings…");
  const settings: [string, unknown][] = [
    ["site", { name: "AZUL — MARHABA MOROCCO 2027", tagline: "YOUR MOROCCO STARTS HERE.", taglineFr: "VOTRE MAROC COMMENCE ICI.", taglineAr: "المغرب يبدأ من هنا", basePriceFrom: 35000 }],
    ["contact", { phone: "+212 600 000 000", whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "212600000000", email: "hello@azul.ma", address: "27 Rue Ibn Aicha, Gueliz, Marrakech 40000", hours: "Mon–Sat 09:00–19:00 (GMT+1)" }],
    ["social", { instagram: "https://instagram.com/azul.marhaba", facebook: "https://facebook.com/azul.marhaba", tiktok: "https://tiktok.com/@azul.marhaba" }],
    ["booking", { currency: "MAD", taxRatePercent: 10, defaultCancelHours: 48, defaultNoticeHours: 24, maxGuestsPerBooking: 20, slotCapacity: 12, referencePrefix: "AZL-2027-" }],
    ["payments", { mode: "DEVELOPMENT", providers: ["DEVELOPMENT"], storeCards: false, testInstructions: "Demo environment: any future date, any 16-digit number, any CVC. No real charge." }],
    ["dataIsDemo", true],
  ];
  for (const [key, value] of settings) {
    await prisma.siteSetting.create({ data: { key, value: value as object } });
  }

  // ---------- translations (FR / AR samples) ----------
  console.log("→ translations…");
  const trans: [string, string, string, string, string][] = [
    ["EXPERIENCE", expIds["agafay-desert-sunset-dinner"], "fr", "title", "Dîner au coucher du soleil dans le désert d'Agafay"],
    ["EXPERIENCE", expIds["agafay-desert-sunset-dinner"], "fr", "summary", "Coucher de soleil privé, musique live et dîner aux chandelles dans le désert de pierre."],
    ["EXPERIENCE", expIds["agafay-desert-sunset-dinner"], "ar", "title", "عشاء الغروب في صحراء أݣفاي"],
    ["EXPERIENCE", expIds["agafay-desert-sunset-dinner"], "ar", "summary", "غروب خاص وموسيقى مباشرة وعشاء على ضوء الشموع في الصحراء الحجرية."],
    ["EXPERIENCE", expIds["marrakech-medina-souks"], "fr", "title", "Visite guidée de la médina et des souks de Marrakech"],
    ["EXPERIENCE", expIds["marrakech-medina-souks"], "ar", "title", "جولة في المدينة القديمة والأسواق بمراكش"],
    ["DESTINATION", destIds["marrakech"], "fr", "shortIntro", "La ville rouge — souks, palais et l'agitation de Jemaa el-Fna."],
    ["DESTINATION", destIds["marrakech"], "ar", "shortIntro", "المدينة الحمراء — الأسواق والقصور وحيوية جامع الفنا."],
    ["FAQ", faqChildrenId, "fr", "question", "Les enfants sont-ils les bienvenus ?"],
  ];
  for (const [entityType, entityId, locale, field, value] of trans) {
    await prisma.translation.create({ data: { entityType, entityId, locale, field, value } });
  }

  // ---------- notifications ----------
  console.log("→ notifications…");
  await prisma.notification.createMany({
    data: [
      { userId: customerUser.id, type: "SYSTEM", title: "Welcome to AZUL", body: "Your account is ready. Save experiences and keep every booking in one place." },
      { userId: customerUser.id, type: "BOOKING_CONFIRMED", title: "Booking AZL-2027-000001 confirmed", payload: { bookingReference: "AZL-2027-000001" } },
      { userId: customerUser.id, type: "REVIEW_REQUEST", title: "How was your Agafay sunset dinner?", body: "Share your experience and help other travellers choose.", payload: { experienceSlug: "agafay-desert-sunset-dinner" } },
    ],
  });

  // ---------- audit ----------
  console.log("→ audit log…");
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "system.seed",
      entity: "System",
      diff: { message: "Initial demo dataset seeded" },
    },
  });

  const counts = {
    users: await prisma.user.count(),
    destinations: await prisma.destination.count(),
    experiences: await prisma.experience.count(),
    availability: await prisma.availability.count(),
    tours: await prisma.tour.count(),
    tourDates: await prisma.tourDate.count(),
    bookings: await prisma.booking.count(),
    reviews: await prisma.review.count(),
    posts: await prisma.blogPost.count(),
    media: await prisma.media.count(),
    faqs: await prisma.faq.count(),
  };
  console.log("✔ seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
