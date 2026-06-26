import db from "../models";
import logger from "../utils/logger";
import { AuthenticatedRequest } from "../middleware/verifyJWT";

export interface AuditEntry {
  action: string;
  resourceType:
    | "user"
    | "worker"
    | "employer"
    | "job"
    | "review"
    | "report"
    | "payment"
    | "payout"
    | "settings"
    | "email_template";
  resourceId?: string | null;
  changes?: Record<string, unknown> | null;
}

/**
 * Write an admin action to the audit trail. Never throws — a failed audit
 * write must not break the underlying admin action.
 */
export async function logAdminAction(
  req: AuthenticatedRequest,
  entry: AuditEntry,
): Promise<void> {
  try {
    await (db as any).AuditLog.create({
      adminId: req.user?.id ?? null,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      changes: entry.changes ?? null,
      ipAddress: (req.ip || req.socket?.remoteAddress) ?? null,
      userAgent: (req.headers?.["user-agent"] as string) ?? null,
    });
  } catch (err: any) {
    logger.error("Failed to write audit log", {
      error: err?.message,
      action: entry.action,
    });
  }
}
