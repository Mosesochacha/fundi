import db from '../models';
import { getIo } from '../middleware/websocket';
import logger from '../utils/logger';

/**
 * In-app notification categories the user can toggle (Profile.notificationSettings).
 * Mirrors DEFAULT_NOTIFICATIONS in workerSettings.controller.ts — only the
 * category gates the bell cares about (delivery channels push/email/sms are a
 * separate concern handled elsewhere).
 */
const CATEGORY_DEFAULTS: Record<string, boolean> = {
  newRequests: true,
  jobAccepted: true,
  jobReminders: true,
  newMessages: true,
  newReviews: true,
  profileViews: false,
};

/** Which settings toggle gates a given notification type (undefined ⇒ always send). */
const TYPE_SETTING: Record<string, keyof typeof CATEGORY_DEFAULTS> = {
  new_message: 'newMessages',
  new_request: 'newRequests',
  job_accepted: 'jobAccepted',
  job_declined: 'jobAccepted',
  job_completed: 'jobAccepted',
  job_cancelled: 'jobAccepted',
  new_review: 'newReviews',
  profile_views: 'profileViews',
  job_reminder: 'jobReminders',
};

export interface CreateNotificationInput {
  /** Recipient User id (notifications are per-user, not per-profile). */
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  /** Relative app path the notification deep-links to. */
  link?: string | null;
  data?: Record<string, unknown> | null;
}

/** True if the recipient hasn't switched off the category this `type` belongs to. */
async function categoryEnabled(userId: string, type: string): Promise<boolean> {
  const key = TYPE_SETTING[type];
  if (!key) return true; // uncategorised types are always delivered
  const profile = await db.Profile.findOne({
    where: { userId },
    attributes: ['notificationSettings'],
  });
  const stored = (profile as any)?.notificationSettings as
    | Record<string, unknown>
    | null
    | undefined;
  const value = stored?.[key];
  return typeof value === 'boolean' ? value : CATEGORY_DEFAULTS[key];
}

/**
 * Persist a notification for a user (respecting their category toggle) and push
 * it to their socket room in real time. Returns the created row, or null when
 * the category is disabled / the create fails — callers should never let a
 * notification failure break the underlying action, so this never throws.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<any | null> {
  try {
    if (!input.userId) return null;
    if (!(await categoryEnabled(input.userId, input.type))) return null;

    const row = await (db as any).Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      data: input.data ?? null,
    });
    const plain = row.get({ plain: true });

    const io = getIo();
    if (io) io.to(String(input.userId)).emit('notification', plain);

    return plain;
  } catch (err) {
    logger.warn('Failed to create notification', { err, type: input.type });
    return null;
  }
}

/** Resolve a profileId to its owning userId (notifications are addressed by userId). */
export async function userIdForProfile(
  profileId: string | null | undefined
): Promise<string | null> {
  if (!profileId) return null;
  const profile = await db.Profile.findByPk(profileId, { attributes: ['userId'] });
  return (profile as any)?.userId ?? null;
}
