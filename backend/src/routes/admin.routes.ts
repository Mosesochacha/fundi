import { Router } from "express";
import requireRole from "../middleware/requireRole";
import { adminValidators } from "../middleware/adminValidators";
import dashboard from "../controllers/admin/dashboard.controller";
import users from "../controllers/admin/users.controller";
import workers from "../controllers/admin/workers.controller";
import employers from "../controllers/admin/employers.controller";
import jobs from "../controllers/admin/jobs.controller";
import reviews from "../controllers/admin/reviews.controller";
import reports from "../controllers/admin/reports.controller";
import finance from "../controllers/admin/finance.controller";
import settings from "../controllers/admin/settings.controller";

const router = Router();

router.use(requireRole("admin"));

router.get("/admin/dashboard", dashboard.dashboard);
router.get("/admin/health", dashboard.health);
router.get("/admin/badges", dashboard.badges);

router.get("/admin/users", users.list);
router.get("/admin/users/:id", users.detail);
router.patch("/admin/users/:id/suspend", adminValidators.suspend, users.suspend);
router.patch("/admin/users/:id/unsuspend", adminValidators.unsuspend, users.unsuspend);
router.patch("/admin/users/:id/ban", adminValidators.ban, users.ban);
router.delete("/admin/users/:id", adminValidators.idOnly, users.remove);

router.get("/admin/workers", workers.list);
router.get("/admin/workers/:id", workers.detail);
router.patch("/admin/workers/:id/verify", workers.verify);
router.patch("/admin/workers/:id/reject-verification", workers.rejectVerification);
router.patch("/admin/workers/:id/suspend", workers.suspend);

router.get("/admin/employers", employers.list);
router.get("/admin/employers/:id", employers.detail);
router.patch("/admin/employers/:id/suspend", employers.suspend);
router.patch("/admin/employers/:id/unsuspend", employers.unsuspend);

router.get("/admin/jobs", jobs.list);
router.get("/admin/jobs/:id", jobs.detail);
router.patch("/admin/jobs/:id/cancel", jobs.cancel);
router.patch("/admin/jobs/:id/flag", jobs.flag);

router.get("/admin/reviews", reviews.list);
router.get("/admin/reviews/:id", reviews.detail);
router.patch("/admin/reviews/:id/hide", reviews.hide);
router.patch("/admin/reviews/:id/keep", reviews.keep);
router.delete("/admin/reviews/:id", reviews.remove);
router.post("/admin/reviews/:id/warn", reviews.warn);

router.get("/admin/reports", reports.list);
router.get("/admin/reports/:id", reports.detail);
router.patch("/admin/reports/:id/resolve", reports.resolve);
router.post("/admin/reports/:id/notes", reports.addNote);

router.get("/admin/payments", finance.payments);
router.get("/admin/payouts", finance.payouts);
router.patch("/admin/payouts/:id/paid", adminValidators.idOnly, finance.markPayoutPaid);
router.patch("/admin/payouts/:id/reject", adminValidators.idOnly, finance.rejectPayout);
router.post("/admin/payouts/process-all", finance.processAllPending);

router.get("/admin/settings", settings.getSettings);
router.patch("/admin/settings", settings.updateSettings);
router.get("/admin/settings/email-templates", settings.listEmailTemplates);
router.patch("/admin/settings/email-templates/:id", settings.updateEmailTemplate);

export default router;
