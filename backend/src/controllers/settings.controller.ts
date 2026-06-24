import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS, normalizeCurrency } from '../utils/constants';

const NOTIFICATION_FIELDS = [
  'emailProfileViewed', 'emailNewFollower', 'emailPostLiked',
  'emailPostComment', 'emailWeeklySummary', 'emailProductUpdates',
];

const PRIVACY_FIELDS = [
  'profilePublic', 'showPhone', 'showEmail', 'showYearsExperience',
  'showProfileViews', 'appearInSearch', 'allowComments', 'allowFollowers',
];

const PREFERENCE_FIELDS = ['language', 'country', 'timezone', 'displayNameFormat', 'profileLayout'];

class SettingsController {
  getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const data: Record<string, any> = {};
    NOTIFICATION_FIELDS.forEach(f => { data[f] = profile[f]; });
    return sendSuccess(res, 'Notifications retrieved', data);
  });

  updateNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const updates: Record<string, any> = {};
    NOTIFICATION_FIELDS.forEach(f => {
      if (f in req.body) updates[f] = !!req.body[f];
    });
    await profile.update(updates);
    return sendSuccess(res, 'Notifications updated', updates);
  });

  getPrivacy = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const data: Record<string, any> = {};
    PRIVACY_FIELDS.forEach(f => { data[f] = profile[f]; });
    return sendSuccess(res, 'Privacy settings retrieved', data);
  });

  updatePrivacy = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const updates: Record<string, any> = {};
    PRIVACY_FIELDS.forEach(f => {
      if (f in req.body) updates[f] = !!req.body[f];
    });
    await profile.update(updates);
    return sendSuccess(res, 'Privacy settings updated', updates);
  });

  getPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [profile, user]: any = await Promise.all([
      db.Profile.findOne({ where: { userId: req.user!.id } }),
      db.User.findByPk(req.user!.id),
    ]);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const data: Record<string, any> = {};
    PREFERENCE_FIELDS.forEach(f => { data[f] = profile[f]; });
    // Currency is a per-user preference (lives on the User model alongside dailyRate).
    data.currency = user?.currency ?? 'USD';
    return sendSuccess(res, 'Preferences retrieved', data);
  });

  updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const updates: Record<string, any> = {};
    PREFERENCE_FIELDS.forEach(f => {
      if (f in req.body) updates[f] = req.body[f];
    });
    await profile.update(updates);

    // Currency is stored on the User model, not the Profile.
    let currency: string | undefined;
    if ('currency' in req.body) {
      const normalized = normalizeCurrency(req.body.currency);
      if (!normalized) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid currency');
      const user = await db.User.findByPk(req.user!.id);
      if (user) await user.update({ currency: normalized });
      currency = normalized;
    }

    return sendSuccess(res, 'Preferences updated', { ...updates, ...(currency ? { currency } : {}) });
  });

  checkUsername = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const u = (req.query.u as string || '').trim().toLowerCase();
    if (!u || u.length < 3) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Username too short');
    if (!/^[a-z0-9_]{3,30}$/.test(u)) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid username format');
    const existing = await db.Profile.findOne({ where: { username: u } });
    const currentProfile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    const available = !existing || existing.id === currentProfile?.id;
    return sendSuccess(res, available ? 'Username available' : 'Username taken', { available });
  });
}

export default new SettingsController();
