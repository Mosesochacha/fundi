import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/verifyJWT";
import db from "../../models";
import { asyncHandler, sendError, sendSuccess } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import { logAdminAction } from "../../services/audit.service";
import { SINGLETON_ID } from "../../models/platformSetting";

const Db = db as any;

async function getRow() {
  let row = await Db.PlatformSetting.findByPk(SINGLETON_ID);
  if (!row) row = await Db.PlatformSetting.findOne();
  return row;
}

class AdminSettingsController {
  getSettings = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const row = await getRow();
    if (!row) return sendError(res, HTTP_STATUS.NOT_FOUND, "Settings not initialised");
    return sendSuccess(res, "Settings", {
      general: row.general,
      commission: row.commission,
      notifications: row.notifications,
      verification: row.verification,
    });
  });

  updateSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const row = await getRow();
    if (!row) return sendError(res, HTTP_STATUS.NOT_FOUND, "Settings not initialised");

    const body = req.body || {};
    const patch: any = {};
    for (const key of ["general", "commission", "notifications", "verification"]) {
      if (body[key] && typeof body[key] === "object") {
        patch[key] = { ...row[key], ...body[key] };
      }
    }
    await row.update(patch);

    await logAdminAction(req, {
      action: "settings_updated",
      resourceType: "settings",
      changes: { groups: Object.keys(patch) },
    });
    return sendSuccess(res, "Settings saved", {
      general: row.general,
      commission: row.commission,
      notifications: row.notifications,
      verification: row.verification,
    });
  });

  // ── Email templates ──
  listEmailTemplates = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const rows = await Db.EmailTemplate.findAll({ order: [["createdAt", "ASC"]] });
    const shaped = rows.map((t: any) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      body: t.body,
    }));
    return sendSuccess(res, "Email templates", shaped);
  });

  updateEmailTemplate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tpl = await Db.EmailTemplate.findByPk(req.params.id);
    if (!tpl) return sendError(res, HTTP_STATUS.NOT_FOUND, "Template not found");
    const { subject, body, name } = req.body || {};
    await tpl.update({
      subject: subject ?? tpl.subject,
      body: body ?? tpl.body,
      name: name ?? tpl.name,
    });
    await logAdminAction(req, {
      action: "email_template_updated",
      resourceType: "email_template",
      resourceId: tpl.id,
    });
    return sendSuccess(res, "Template saved", {
      id: tpl.id,
      name: tpl.name,
      subject: tpl.subject,
      body: tpl.body,
    });
  });
}

export default new AdminSettingsController();
