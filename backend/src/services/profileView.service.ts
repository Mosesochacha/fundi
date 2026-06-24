import crypto from 'crypto';
import type { Request } from 'express';
import { Op } from 'sequelize';
import db from '../models';

/**
 * Record a view of a profile, deduped per IP per hour, and bump the profile's
 * `views` counter. Mirrors the social-profile tracking in profile.controller.
 * Fire-and-forget: view tracking must never break the page request.
 */
export async function recordProfileView(
  req: Request,
  profileId: string
): Promise<void> {
  try {
    const clientIp =
      req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      'unknown';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const referrer =
      (req.headers.referer as string) || (req.query.ref as string) || null;
    const parsedRef =
      referrer?.includes('wa.me') || referrer?.includes('whatsapp')
        ? 'whatsapp'
        : referrer?.includes('instagram')
          ? 'instagram'
          : referrer?.includes('google')
            ? 'google'
            : referrer
              ? 'direct'
              : null;

    const recent = await (db as any).ProfileView.findOne({
      where: { profileId, ipHash, createdAt: { [Op.gte]: oneHourAgo } },
    });
    if (recent) return;

    await Promise.all([
      (db as any).ProfileView.create({ profileId, ipHash, referrer: parsedRef }),
      db.Profile.increment('views', { where: { id: profileId } }),
    ]);
  } catch {
    /* view tracking is best-effort */
  }
}
