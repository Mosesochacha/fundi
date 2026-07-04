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

const NUMERIC_BOUNDS: Record<string, Record<string, [number, number]>> = {
  commission: {
    transactionFeePct: [0, 100],
    workerSubscription: [0, 1_000_000],
    featuredListing: [0, 1_000_000],
  },
  verification: {
    minProfileStrength: [0, 100],
  },
};

function validateSettingsGroup(group: string, value: Record<string, unknown>): string | null {
  const bounds = NUMERIC_BOUNDS[group];
  if (bounds) {
    for (const [field, [min, max]] of Object.entries(bounds)) {
      if (field in value) {
        const n = value[field];
        if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) {
          return `${group}.${field} must be a number between ${min} and ${max}`;
        }
      }
    }
  }
  return null;
}

export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<\s*(script|iframe|object|embed|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
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
      if (body[key] && typeof body[key] === "object" && !Array.isArray(body[key])) {
        const err = validateSettingsGroup(key, body[key]);
        if (err) return sendError(res, HTTP_STATUS.BAD_REQUEST, err);
        patch[key] = { ...row[key], ...body[key] };
      }
    }
    if (Object.keys(patch).length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "No valid settings groups provided");
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

    if (subject !== undefined && (typeof subject !== "string" || subject.length > 255)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "subject must be a string up to 255 chars");
    }
    if (name !== undefined && (typeof name !== "string" || name.length > 120)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "name must be a string up to 120 chars");
    }
    if (body !== undefined && (typeof body !== "string" || body.length > 50_000)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "body must be a string up to 50,000 chars");
    }

    await tpl.update({
      subject: subject !== undefined ? subject.trim() : tpl.subject,
      body: body !== undefined ? sanitizeEmailHtml(body) : tpl.body,
      name: name !== undefined ? name.trim() : tpl.name,
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
