/**
 * Seed realistic worker profiles for launch, so /browse looks populated.
 *
 *   Dry run (no writes, prints delete list + samples):
 *     npx ts-node --transpile-only src/scripts/seed-workers.ts --dry-run
 *   Commit:
 *     npx ts-node --transpile-only src/scripts/seed-workers.ts
 *   Optional count (default 100):
 *     npx ts-node --transpile-only src/scripts/seed-workers.ts --count=120
 *
 * Design decisions (agreed with the founder):
 *  - Deletes existing DEMO worker profiles (role=user, accountType null|worker)
 *    but PROTECTS an allowlist (founder + admin/moderator accounts).
 *  - Rich, well-filled profiles but NO fabricated reviews and NO fake "verified"
 *    badges (isPhoneVerified stays false). Cards show "New", which is honest.
 *  - Real portrait photos (randomuser.me) for most avatars, DiceBear generative
 *    for a minority; picsum for banners + portfolio work-photos.
 *  - All seeded users share the @seed.tesilix.app email domain so they can be
 *    bulk-removed later with a single query.
 */
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import db from "../models";

const Db = db as any;

// ---- CLI flags ---------------------------------------------------------------
const DRY_RUN = process.argv.includes("--dry-run");
const countArg = process.argv.find((a) => a.startsWith("--count="));
const COUNT = Math.max(1, Number(countArg?.split("=")[1]) || 200);
const POSTS_PER_WORKER: [number, number] = [1, 4]; // range; ~15% get none

const SEED_DOMAIN = "seed.tesilix.app";
const PROTECT_EMAILS = [
  "ochachamoses444@gmail.com",
  "moses@leadersoftoday.com",
].map((e) => e.toLowerCase());

// ---- deterministic pseudo-random (stable output across runs) ----------------
let _s = 987654321;
const rnd = () => {
  // xorshift — deterministic, no Math.random so reruns are reproducible
  _s ^= _s << 13;
  _s ^= _s >>> 17;
  _s ^= _s << 5;
  return ((_s >>> 0) % 100000) / 100000;
};
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p: number) => rnd() < p;

// ---- data pools -------------------------------------------------------------
const MALE = [
  "Samuel", "David", "Joseph", "Daniel", "Michael", "James", "Emmanuel", "Kwame",
  "Kofi", "Chidi", "Emeka", "Tunde", "Musa", "Ibrahim", "Yusuf", "Omar", "Hassan",
  "Ali", "Raj", "Arjun", "Wei", "Diego", "Carlos", "Mateo", "Liam", "Noah",
  "Ethan", "Brian", "Kevin", "Peter", "Victor", "Felix", "Otieno", "Kamau",
  "Njoroge", "Wanjala", "Baraka", "Juma", "Sipho", "Thabo",
];
const FEMALE = [
  "Grace", "Mary", "Faith", "Joy", "Amara", "Ngozi", "Chioma", "Aisha", "Fatima",
  "Zainab", "Amina", "Layla", "Priya", "Ananya", "Mei", "Sofia", "Valentina",
  "Camila", "Emma", "Olivia", "Mia", "Sarah", "Esther", "Ruth", "Naomi",
  "Wanjiku", "Akinyi", "Nyambura", "Adaeze", "Halima", "Zola", "Lerato",
];
const LAST = [
  "Otieno", "Kamau", "Mwangi", "Njoroge", "Wanjiru", "Ochieng", "Achieng",
  "Okafor", "Okoro", "Adeyemi", "Balogun", "Mensah", "Osei", "Boateng", "Diallo",
  "Traore", "Khan", "Sharma", "Patel", "Singh", "Chen", "Garcia", "Martinez",
  "Silva", "Smith", "Johnson", "Brown", "Williams", "Ali", "Hassan", "Ahmed",
  "Nguyen", "Kim", "Bello", "Dube", "Ndlovu", "Mutua", "Nkosi", "Obi", "Cisse",
];

interface City {
  name: string; country: string; currency: string; symbol: string;
  rate: [number, number]; areas: string[];
}
const CITIES: { city: City; weight: number }[] = [
  { weight: 4, city: { name: "Nairobi", country: "KE", currency: "KES", symbol: "KSh", rate: [1500, 6000], areas: ["Westlands", "Kilimani", "Karen", "Ruaka", "Kasarani", "Lang'ata", "Embakasi"] } },
  { weight: 3, city: { name: "Lagos", country: "NG", currency: "NGN", symbol: "₦", rate: [10000, 45000], areas: ["Lekki", "Ikeja", "Yaba", "Surulere", "Victoria Island", "Ikorodu"] } },
  { weight: 2, city: { name: "Accra", country: "GH", currency: "GHS", symbol: "₵", rate: [150, 700], areas: ["Osu", "East Legon", "Tema", "Adenta", "Spintex"] } },
  { weight: 2, city: { name: "London", country: "GB", currency: "GBP", symbol: "£", rate: [120, 380], areas: ["Camden", "Hackney", "Croydon", "Ealing", "Brixton"] } },
  { weight: 2, city: { name: "Dubai", country: "AE", currency: "AED", symbol: "د.إ", rate: [150, 650], areas: ["Marina", "Deira", "Jumeirah", "Al Barsha", "Business Bay"] } },
  { weight: 2, city: { name: "Johannesburg", country: "ZA", currency: "ZAR", symbol: "R", rate: [400, 1600], areas: ["Sandton", "Soweto", "Randburg", "Rosebank", "Midrand"] } },
];
// Even global spread — one entry per city (weights kept for reference only).
const CITY_BAG: City[] = CITIES.map(({ city }) => city);

interface Trade {
  name: string; tagline: string; services: string[]; certs: string[];
  jobTypes: string[]; bio: (yrs: number, city: string) => string;
}
const TRADES: Trade[] = [
  {
    name: "Plumber",
    tagline: "Leak-free homes, done right the first time",
    services: ["Leak detection & repair", "Pipe installation", "Water heater fitting", "Drain unblocking", "Bathroom plumbing", "Tap & fixture replacement"],
    certs: ["Certified Plumbing Technician", "Water Supply Installation Cert."],
    jobTypes: ["Bathroom re-pipe", "Kitchen sink install", "Water heater fix", "Burst pipe repair"],
    bio: (y, c) => `Licensed plumber with ${y} years serving homes and businesses across ${c}. I handle everything from stubborn leaks to full bathroom installs — clean work, fair pricing and no mess left behind.`,
  },
  {
    name: "Electrician",
    tagline: "Safe, certified wiring for home & business",
    services: ["House wiring", "Fault finding & repair", "Socket & switch install", "Lighting design", "Consumer unit upgrade", "Backup & inverter setup"],
    certs: ["Licensed Electrical Installer", "Wiring Regulations Cert."],
    jobTypes: ["Full house rewire", "DB board upgrade", "Security light install", "Fault diagnosis"],
    bio: (y, c) => `Certified electrician, ${y} years in the trade around ${c}. Safety-first wiring, quick fault-finding and tidy installations. Available for both small fixes and full projects.`,
  },
  {
    name: "Carpenter",
    tagline: "Custom woodwork built to last",
    services: ["Custom furniture", "Fitted wardrobes", "Kitchen cabinets", "Door & window frames", "Wood repairs", "Shelving & storage"],
    certs: ["Joinery & Cabinetmaking Cert.", "Vocational Woodwork Diploma"],
    jobTypes: ["Fitted wardrobe", "Kitchen cabinets", "Custom dining table", "Door hanging"],
    bio: (y, c) => `Carpenter and joiner with ${y} years crafting furniture and fittings in ${c}. From bespoke wardrobes to kitchen units, I build solid pieces that last — measured, made and installed by hand.`,
  },
  {
    name: "Painter",
    tagline: "Clean lines and a flawless finish",
    services: ["Interior painting", "Exterior painting", "Wall preparation", "Decorative finishes", "Wallpaper hanging", "Waterproof coatings"],
    certs: ["Painting & Decorating Cert."],
    jobTypes: ["Full-house repaint", "Feature wall", "Exterior refresh", "Ceiling & trim"],
    bio: (y, c) => `Professional painter & decorator, ${y} years across ${c}. Careful prep, crisp edges and durable finishes — interior or exterior. I protect your space and leave it spotless.`,
  },
  {
    name: "Mason",
    tagline: "Strong foundations, neat brickwork",
    services: ["Bricklaying", "Plastering", "Concrete work", "Boundary walls", "Foundations", "Paving & slabs"],
    certs: ["Masonry & Bricklaying Cert."],
    jobTypes: ["Boundary wall", "House foundation", "Plastering", "Paved driveway"],
    bio: (y, c) => `Mason with ${y} years building in ${c}. Foundations, walls, plaster and paving done to a high standard. Reliable on site and precise with every course.`,
  },
  {
    name: "Welder",
    tagline: "Precision metalwork & fabrication",
    services: ["Gates & grilles", "Steel fabrication", "Staircases & railings", "Repairs & reinforcement", "Window bars", "Custom metal furniture"],
    certs: ["Certified Welder (Arc & MIG)", "Metal Fabrication Cert."],
    jobTypes: ["Steel gate", "Balcony railing", "Window grilles", "Rooftop staircase"],
    bio: (y, c) => `Welder and metal fabricator, ${y} years in ${c}. Gates, railings, grilles and custom steelwork — strong, straight and finished to spec. Site or workshop.`,
  },
  {
    name: "Mechanic",
    tagline: "Honest diagnostics, dependable repairs",
    services: ["Engine diagnostics", "Brake & suspension", "Servicing", "Electrical faults", "Clutch & gearbox", "Pre-purchase inspection"],
    certs: ["Automotive Mechanics Cert.", "Auto Electrical Diploma"],
    jobTypes: ["Full service", "Brake overhaul", "Engine diagnosis", "Suspension repair"],
    bio: (y, c) => `Auto mechanic with ${y} years keeping cars on the road in ${c}. Straight talk on what actually needs fixing, quality parts and workmanship you can trust. Mobile call-outs available.`,
  },
  {
    name: "AC Tech",
    tagline: "Cool spaces, efficient systems",
    services: ["AC installation", "Servicing & gas refill", "Fault repair", "Ductwork", "Fridge & freezer repair", "Preventive maintenance"],
    certs: ["HVAC & Refrigeration Cert."],
    jobTypes: ["Split AC install", "AC service", "Cold room repair", "Gas top-up"],
    bio: (y, c) => `HVAC & refrigeration technician, ${y} years in ${c}. Installations, servicing and quick repairs for AC and cold rooms — done cleanly and running efficiently.`,
  },
  {
    name: "Gardener",
    tagline: "Green, tidy outdoor spaces",
    services: ["Lawn care", "Hedge trimming", "Planting & landscaping", "Garden clearance", "Irrigation setup", "Tree pruning"],
    certs: ["Horticulture & Landscaping Cert."],
    jobTypes: ["Garden makeover", "Lawn install", "Hedge shaping", "Irrigation setup"],
    bio: (y, c) => `Gardener & landscaper with ${y} years in ${c}. Lawns, hedges, planting and full garden makeovers — I keep outdoor spaces healthy, neat and thriving all year.`,
  },
  {
    name: "Cleaner",
    tagline: "Spotless spaces, every time",
    services: ["Deep cleaning", "Move-in / move-out", "Office cleaning", "Post-construction", "Sofa & carpet cleaning", "Regular housekeeping"],
    certs: ["Professional Cleaning Cert."],
    jobTypes: ["Deep clean", "Move-out clean", "Office clean", "Carpet shampoo"],
    bio: (y, c) => `Professional cleaner, ${y} years across ${c}. Homes, offices and post-construction cleans done thoroughly and reliably. Fully equipped, discreet and detail-focused.`,
  },
  {
    name: "House help",
    tagline: "Trusted, reliable home support",
    services: ["Housekeeping", "Cooking", "Laundry & ironing", "Childcare support", "Elderly care", "Errands & shopping"],
    certs: ["Home Management Cert.", "First Aid Certificate"],
    jobTypes: ["Live-out housekeeping", "Meal prep", "Laundry service", "Childminding"],
    bio: (y, c) => `Experienced house help with ${y} years supporting families in ${c}. Housekeeping, cooking and childcare handled warmly and dependably. References available on request.`,
  },
  {
    name: "Chef",
    tagline: "Great food, cooked to order",
    services: ["Private chef", "Event catering", "Meal prep", "Pastry & baking", "Menu planning", "Cooking classes"],
    certs: ["Culinary Arts Diploma", "Food Hygiene & Safety Cert."],
    jobTypes: ["Private dinner", "Event catering", "Weekly meal prep", "Birthday cake"],
    bio: (y, c) => `Private chef & caterer, ${y} years cooking across ${c}. From intimate dinners to full events — fresh menus, clean kitchens and food people remember. Dietary needs welcome.`,
  },
];

const EXP_COMPANIES = [
  "Brightline Contractors", "Homefix Services", "Prime Build Ltd", "Urban Works",
  "Reliable Trades Co.", "Metro Facilities", "Cornerstone Projects", "Apex Maintenance",
  "GreenLeaf Services", "SwiftFix", "Trusted Hands Ltd", "BuildRight",
];

// ---- generation -------------------------------------------------------------
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 40);

interface Generated {
  user: Record<string, any>;
  profile: Record<string, any>;
  posts: Record<string, any>[]; // authorId attached at insert time
  passwordHash: string;
}

let _postSeq = 0;
/** A few plausible feed posts (SHOWCASE + TIP) for a worker. */
function buildPosts(
  trade: Trade,
  area: string,
  portfolio: { url: string }[],
): Record<string, any>[] {
  const n = chance(0.85) ? int(POSTS_PER_WORKER[0], POSTS_PER_WORKER[1]) : 0;
  const showcase = [
    (jt: string) => `Wrapped up a ${jt.toLowerCase()} in ${area} this week — really happy with how it turned out. 👇`,
    (jt: string) => `Another one done in ${area}. ${jt} completed on time and on budget. ✅`,
    (jt: string) => `Before → after: ${jt.toLowerCase()} in ${area}. The details are everything.`,
    (jt: string) => `Proud of this ${jt.toLowerCase()} in ${area}. Quality over shortcuts, every time.`,
  ];
  const tips = [
    () => `${trade.name} tip: always get a clear written quote before any work starts — no surprises later.`,
    () => `Quick tip — ${pick(trade.services).toLowerCase()} is where corners get cut. Don't let them.`,
    () => `Hiring a ${trade.name.toLowerCase()}? Ask for recent work photos and references. Good ones have them ready.`,
  ];
  const posts: Record<string, any>[] = [];
  for (let i = 0; i < n; i++) {
    const isShowcase = chance(0.7);
    const content = isShowcase ? pick(showcase)(pick(trade.jobTypes)) : pick(tips)();
    const imgs = isShowcase && portfolio.length
      ? portfolio.slice(0, int(1, Math.min(3, portfolio.length))).map((p) => p.url)
      : [];
    const daysBack = int(0, 75);
    posts.push({
      content,
      postType: isShowcase ? "SHOWCASE" : "TIP",
      images: imgs,
      status: "PUBLISHED",
      likesCount: int(0, 64),
      commentsCount: int(0, 14),
      slug: `${slugify(content).slice(0, 60)}-${(_postSeq++).toString(36)}${int(100, 999)}`,
      createdAt: new Date(Date.now() - daysBack * 86_400_000 - int(0, 86_400_000)),
      updatedAt: new Date(Date.now() - daysBack * 86_400_000),
    });
  }
  return posts;
}

function generate(count: number, takenUsernames: Set<string>): Generated[] {
  const passwordHash = bcrypt.hashSync("Fundi@Seed2026!", 10);
  const out: Generated[] = [];
  const usedUser = new Set(takenUsernames);
  const usedEmail = new Set<string>();

  for (let i = 0; i < count; i++) {
    const female = chance(0.42);
    const first = female ? pick(FEMALE) : pick(MALE);
    const last = pick(LAST);
    const fullName = `${first} ${last}`;

    // unique username
    let base = slugify(first + last);
    let username = base;
    let n = 1;
    while (usedUser.has(username)) username = `${base}${++n}`;
    usedUser.add(username);

    // unique seed email
    let email = `${username}@${SEED_DOMAIN}`;
    while (usedEmail.has(email)) email = `${username}${int(1, 999)}@${SEED_DOMAIN}`;
    usedEmail.add(email);

    const city = pick(CITY_BAG);
    const area = pick(city.areas);
    const trade = pick(TRADES);
    const yrs = int(2, 19);
    const rate = Math.round(int(city.rate[0], city.rate[1]) / 50) * 50;

    // avatar: ~80% real portrait, ~20% generative
    const portraitIdx = int(0, 99);
    const useGen = chance(0.2);
    const avatarUrl = useGen
      ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(username)}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c9a84c`
      : `https://randomuser.me/api/portraits/${female ? "women" : "men"}/${portraitIdx}.jpg`;

    const bannerUrl = `https://picsum.photos/seed/${username}cover/1200/360`;

    // portfolio work-photos (gallery that renders on the profile)
    const photoCount = int(3, 6);
    const portfolio = Array.from({ length: photoCount }, (_, k) => ({
      id: uuidv4(),
      url: `https://picsum.photos/seed/${username}work${k}/900/650`,
      caption: pick(trade.jobTypes),
      jobType: trade.name,
    }));
    const workPhotos = portfolio.map((p) => p.url);

    // services: 4-6 from the trade
    const svc = [...trade.services];
    const services: string[] = [];
    const svcCount = int(4, Math.min(6, svc.length));
    for (let s = 0; s < svcCount; s++) services.push(svc.splice(Math.floor(rnd() * svc.length), 1)[0]);

    // certifications: 0-2 (drives the "certified" filter — intentionally varied)
    const certCount = chance(0.65) ? int(1, 2) : 0;
    const certPool = [...trade.certs];
    const certifications = Array.from({ length: Math.min(certCount, certPool.length) }, () => ({
      id: uuidv4(),
      name: certPool.splice(Math.floor(rnd() * certPool.length), 1)[0],
      issuer: pick(["National Vocational Board", "City & Guilds", "Technical Institute", "Skills Authority"]),
      year: 2026 - int(1, Math.max(1, yrs)),
    }));

    // experience: 1-2 roles
    const startY = 2026 - yrs;
    const experience = [
      {
        title: `${trade.name}`,
        company: "Independent / Self-employed",
        startYear: 2026 - int(1, Math.max(1, yrs - 1) || 1),
        endYear: null,
        description: `Running my own ${trade.name.toLowerCase()} service for clients across ${city.name}.`,
      },
    ];
    if (yrs >= 5) {
      experience.push({
        title: `${trade.name}`,
        company: pick(EXP_COMPANIES),
        startYear: startY,
        endYear: 2026 - int(1, Math.max(2, yrs - 2)),
        description: `Gained hands-on experience on residential and commercial jobs.`,
      });
    }

    const serviceAreas = [area, ...city.areas.filter((a) => a !== area)].slice(0, int(2, 4));

    out.push({
      passwordHash,
      posts: buildPosts(trade, area, portfolio),
      user: {
        firstName: first,
        lastName: last,
        email,
        passwordHash,
        role: "user",
        accountType: "worker",
        isPhoneVerified: false, // no fabricated verification
        isProfileComplete: true,
        isOnboarded: true,
        onboardingCompletedAt: new Date(),
        emailVerified: true,
        status: "active",
        isActive: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        dailyRate: rate,
        currency: city.currency,
        currencySymbol: city.symbol,
      },
      profile: {
        username,
        fullName,
        profession: trade.name,
        location: `${area}, ${city.name}`,
        country: city.country,
        bio: trade.bio(yrs, city.name),
        tagline: trade.tagline,
        avatarUrl,
        bannerUrl,
        yearsExperience: yrs,
        services,
        serviceAreas,
        workPhotos,
        portfolio,
        certifications,
        experience,
        education: [],
        isAvailable: chance(0.75),
        idVerificationStatus: "unverified",
        profilePublic: true,
        appearInSearch: true,
        showRate: true,
        allowDirectMessages: true,
        views: int(40, 4200),
      },
    });
  }
  return out;
}

// ---- main -------------------------------------------------------------------
async function main() {
  await Db.sequelize.authenticate();

  // Delete candidates: demo workers (role=user, accountType null|worker),
  // excluding the protected allowlist. Employers/admin/mods are never touched.
  const deleteCandidates = await Db.User.findAll({
    where: {
      role: "user",
      accountType: { [Op.or]: [null, "worker"] },
      email: { [Op.notIn]: PROTECT_EMAILS },
    },
    include: [{ model: Db.Profile, as: "profile", attributes: ["id", "username"] }],
    attributes: ["id", "email", "firstName", "lastName", "accountType", "createdAt"],
    order: [["createdAt", "ASC"]],
  });

  console.log(`\n=== DELETE CANDIDATES (${deleteCandidates.length}) ===`);
  console.log("(protected & never deleted:", PROTECT_EMAILS.join(", "), "+ any admin/moderator)");
  for (const u of deleteCandidates) {
    console.log(
      `  - ${u.email}  |  ${u.firstName} ${u.lastName}  |  acct=${u.accountType ?? "null"}  |  @${u.profile?.username ?? "—"}`,
    );
  }

  const takenUsernames = new Set<string>(
    (await Db.Profile.findAll({ attributes: ["username"] })).map((p: any) => p.username),
  );
  // usernames that will be freed by deletion can be reused
  for (const u of deleteCandidates) if (u.profile?.username) takenUsernames.delete(u.profile.username);

  const generated = generate(COUNT, takenUsernames);

  console.log(`\n=== WILL CREATE ${generated.length} WORKERS (sample of 5) ===`);
  for (const g of generated.slice(0, 5)) {
    console.log(
      `  + ${g.profile.fullName} — ${g.profile.profession} — ${g.profile.location} — ` +
        `${g.user.currencySymbol}${g.user.dailyRate}/day — ${g.profile.yearsExperience}yr — @${g.profile.username}\n` +
        `      avatar: ${g.profile.avatarUrl}`,
    );
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written. Re-run without --dry-run to commit.\n");
    await Db.sequelize.close();
    return;
  }

  const t = await Db.sequelize.transaction();
  try {
    // 1) delete demo workers. Remove their posts first — Posts.authorId → Profiles
    //    has no cascade, so it would otherwise block the profile delete.
    const candidateProfileIds = deleteCandidates
      .map((u: any) => u.profile?.id)
      .filter(Boolean);
    if (candidateProfileIds.length && Db.Post) {
      await Db.Post.destroy({
        where: { authorId: { [Op.in]: candidateProfileIds } },
        transaction: t,
      });
    }
    const ids = deleteCandidates.map((u: any) => u.id);
    let deleted = 0;
    if (ids.length) {
      deleted = await Db.User.destroy({ where: { id: { [Op.in]: ids } }, transaction: t });
    }

    // 2) create users, profiles, then their posts
    let created = 0;
    let postCount = 0;
    for (const g of generated) {
      const user = await Db.User.create(g.user, { transaction: t });
      const profile = await Db.Profile.create({ ...g.profile, userId: user.id }, { transaction: t });
      for (const post of g.posts) {
        await Db.Post.create({ ...post, authorId: profile.id }, { transaction: t });
        postCount++;
      }
      created++;
    }

    await t.commit();
    console.log(`\n✅ Deleted ${deleted} demo users, created ${created} worker profiles + ${postCount} posts.`);
    const publicNow = await Db.Profile.count({ where: { profilePublic: true, appearInSearch: true } });
    console.log(`   Public + searchable profiles now: ${publicNow}`);
  } catch (e) {
    await t.rollback();
    throw e;
  }

  await Db.sequelize.close();
}

main().catch((e) => {
  console.error("\n❌ Seed failed:", e?.message || e);
  process.exit(1);
});
