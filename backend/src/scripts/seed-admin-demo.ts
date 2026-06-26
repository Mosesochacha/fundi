/**
 * Idempotent-ish demo seeder for the admin console. Generates payments,
 * payouts and user-reports from existing users/jobs, and gives some workers
 * an ID-verification status so the verification queue isn't empty.
 *
 * Run once:  npx ts-node --transpile-only src/scripts/seed-admin-demo.ts
 */
import db from "../models";

const Db = db as any;

const REPORT_TYPES = [
  "fake_profile",
  "harassment",
  "inappropriate_review",
  "payment_dispute",
  "spam",
  "other",
] as const;
const SEVERITIES = ["high", "medium", "low"] as const;
const REPORT_STATUS = ["open", "in_review", "resolved"] as const;
const PAY_STATUS = ["completed", "completed", "pending", "refunded", "failed"] as const;
const PAYOUT_STATUS = ["pending", "pending", "processing", "paid", "failed"] as const;
const pick = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length];
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

async function main() {
  await Db.sequelize.authenticate();

  const workers = await Db.User.findAll({
    where: { accountType: "worker" },
    include: [{ model: Db.Profile, as: "profile" }],
  });
  const employers = await Db.User.findAll({
    where: { accountType: "employer" },
    include: [{ model: Db.Profile, as: "profile" }],
  });
  console.log(`Found ${workers.length} workers, ${employers.length} employers.`);

  let verUpdated = 0;
  for (let i = 0; i < workers.length; i++) {
    const p = workers[i].profile;
    if (!p) continue;
    const status =
      i % 4 === 0 ? "pending" : i % 7 === 0 ? "rejected" : i % 3 === 0 ? "unverified" : "verified";
    await p.update({
      idVerificationStatus: status,
      idDocUrl: status !== "unverified" ? `https://picsum.photos/seed/id${i}/600/380` : null,
      selfieUrl: status !== "unverified" ? `https://picsum.photos/seed/selfie${i}/400/400` : null,
      idSelfieMatch: status === "verified" ? true : status === "rejected" ? false : null,
      idVerifiedAt: status === "verified" ? daysAgo(i) : null,
    });
    verUpdated++;
  }
  console.log(`Set verification status on ${verUpdated} worker profiles.`);

  const jobs = await Db.JobRequest.findAll({ limit: 60, order: [["createdAt", "DESC"]] });
  const profById: Record<string, any> = {};
  for (const u of [...workers, ...employers]) if (u.profile) profById[u.profile.id] = u;

  const existingPayments = await Db.Payment.count();
  if (existingPayments === 0) {
    let n = 0;
    for (let i = 0; i < Math.min(jobs.length, 48); i++) {
      const j = jobs[i];
      const employerUser = profById[j.employerId];
      const workerUser = profById[j.workerId];
      const amount = j.agreedRate || 2000 + ((i * 530) % 14000);
      await Db.Payment.create({
        reference: `TX${80421 + i * 37}`,
        employerId: employerUser?.id ?? null,
        workerId: workerUser?.id ?? null,
        jobId: j.id,
        amount,
        fee: Math.round(amount * 0.1),
        currency: "KES",
        method: i % 2 === 0 ? "M-Pesa" : "Card",
        status: pick(PAY_STATUS, i),
        createdAt: daysAgo(i),
        updatedAt: daysAgo(i),
      });
      n++;
    }
    console.log(`Created ${n} payments.`);
  } else {
    console.log(`Payments already present (${existingPayments}), skipping.`);
  }

  const existingPayouts = await Db.Payout.count();
  if (existingPayouts === 0) {
    let n = 0;
    for (let i = 0; i < Math.min(workers.length, 31); i++) {
      await Db.Payout.create({
        reference: `PO${50120 + i * 19}`,
        workerId: workers[i].id,
        amount: 1800 + ((i * 610) % 12000),
        currency: "KES",
        method: i % 2 === 0 ? "M-Pesa" : "Bank transfer",
        destination: i % 2 === 0 ? `+2547••••${100 + i}` : `••••${4000 + i}`,
        status: pick(PAYOUT_STATUS, i),
        createdAt: daysAgo(i),
        updatedAt: daysAgo(i),
      });
      n++;
    }
    console.log(`Created ${n} payouts.`);
  } else {
    console.log(`Payouts already present (${existingPayouts}), skipping.`);
  }

  const existingReports = await Db.UserReport.count();
  if (existingReports === 0 && workers.length && employers.length) {
    let n = 0;
    for (let i = 0; i < 24; i++) {
      const reported = pick([...workers, ...employers], i * 3);
      const reporter = pick([...employers, ...workers], i * 5 + 1);
      if (reported.id === reporter.id) continue;
      await Db.UserReport.create({
        type: pick(REPORT_TYPES, i),
        severity: pick(SEVERITIES, i),
        status: pick(REPORT_STATUS, i),
        reportedUserId: reported.id,
        filedById: reporter.id,
        description:
          "The user repeatedly sent unsolicited messages and used abusive language after the job was declined. Screenshots attached for review.",
        evidence:
          i % 2 === 0
            ? [`https://picsum.photos/seed/ev${i}a/600/400`, `https://picsum.photos/seed/ev${i}b/600/400`]
            : [],
        relatedContent: `Conversation thread with ${reported.firstName}`,
        notes:
          i % 3 === 0
            ? [{ id: `note-${i}`, admin: "System", at: daysAgo(i).toISOString(), text: "Auto-triaged on intake." }]
            : [],
        createdAt: daysAgo(i),
        updatedAt: daysAgo(i),
      });
      n++;
    }
    console.log(`Created ${n} user reports.`);
  } else {
    console.log(`Reports already present (${existingReports}) or no users, skipping.`);
  }

  console.log("✅ Admin demo seed complete.");
  await Db.sequelize.close();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
