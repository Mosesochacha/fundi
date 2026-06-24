import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import AuthService from '../services/auth.service';
import OTPService from '../services/otp.service';
import { getFileUrl } from '../middleware/upload';
import { sendSuccess, sendError, asyncHandler, isValidEmail } from '../utils/helpers';
import { HTTP_STATUS, normalizeCurrency } from '../utils/constants';

/* ─────────────────────────────────────────────────────────────────────────
   Worker settings (/worker/settings). Maps the page's WorkerSettings shape onto
   the User + Profile models. Worker-specific notification/availability detail
   lives in the Profile.notificationSettings / availabilitySettings JSON columns;
   privacy + the simple availability flag reuse existing Profile columns.
   ───────────────────────────────────────────────────────────────────────── */

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

const DEFAULT_NOTIFICATIONS = {
  newRequests: true,
  jobAccepted: true,
  jobReminders: true,
  newMessages: true,
  newReviews: true,
  profileViews: false,
  push: true,
  email: true,
  sms: false,
};

const DEFAULT_AVAILABILITY_EXTRAS = {
  emergencyCallouts: true,
  weekends: false,
  workingHoursFrom: '07:00',
  workingHoursTo: '18:00',
  maxDistance: '10',
};

type Json = Record<string, unknown>;

/** Merge stored JSON onto a defaults object, keeping only known keys. */
function mergeDefaults<T extends Json>(defaults: T, stored: unknown): T {
  const out = { ...defaults };
  if (stored && typeof stored === 'object') {
    for (const key of Object.keys(defaults)) {
      const v = (stored as Json)[key];
      if (v !== undefined && v !== null) (out as Json)[key] = v;
    }
  }
  return out;
}

/** Resolve the authenticated user's User + Profile rows. */
async function loadUserAndProfile(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) return { userId: null, user: null, profile: null };
  const [user, profile] = await Promise.all([
    db.User.findByPk(userId),
    db.Profile.findOne({ where: { userId } }),
  ]);
  return { userId, user, profile };
}

/** Assemble the full WorkerSettings document the client expects. */
function shapeSettings(user: any, profile: any) {
  return {
    profile: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      username: profile.username ?? '',
      profession: profile.profession ?? '',
      location: profile.location ?? '',
      about: profile.bio ?? '',
      dailyRate: user.dailyRate ?? null,
      currency: user.currency ?? 'USD',
      avatarUrl: profile.avatarUrl ?? null,
    },
    account: {
      email: user.email ?? '',
      emailVerified: !!user.emailVerified,
      phone: user.phoneNumber ?? '',
      phoneVerified: !!user.isPhoneVerified,
      // Google linking isn't tracked on the account model yet.
      googleConnected: false,
      googleEmail: null,
    },
    notifications: mergeDefaults(DEFAULT_NOTIFICATIONS, profile.notificationSettings),
    privacy: {
      publicProfile: profile.profilePublic ?? true,
      showPhone: profile.showPhone ?? false,
      showRate: profile.showRate ?? true,
      showOnline: profile.showOnline ?? true,
      allowDirectMessages: profile.allowDirectMessages ?? true,
      appearInSearch: profile.appearInSearch ?? true,
    },
    availability: {
      available: profile.isAvailable ?? true,
      ...mergeDefaults(DEFAULT_AVAILABILITY_EXTRAS, profile.availabilitySettings),
    },
  };
}

class WorkerSettingsController {
  // GET /worker/settings — the full settings document.
  getSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user, profile } = await loadUserAndProfile(req);
    if (!user || !profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    return sendSuccess(res, 'Settings retrieved', shapeSettings(user, profile));
  });

  // PATCH /worker/profile — names + daily rate on User, the rest on Profile.
  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user, profile } = await loadUserAndProfile(req);
    if (!user || !profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const { firstName, lastName, username, profession, location, about, dailyRate, currency } = req.body;

    const userUpdates: Record<string, any> = {};
    const profileUpdates: Record<string, any> = {};

    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || firstName.trim().length < 2) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'First name must be at least 2 characters');
      }
      userUpdates.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (typeof lastName !== 'string' || lastName.trim().length < 2) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Last name must be at least 2 characters');
      }
      userUpdates.lastName = lastName.trim();
    }

    if (username !== undefined) {
      const uname = String(username).trim().toLowerCase();
      if (!USERNAME_RE.test(uname)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Username must be 3-30 chars: letters, numbers, underscores');
      }
      if (uname !== profile.username) {
        const existing = await db.Profile.findOne({ where: { username: uname } });
        if (existing && existing.id !== profile.id) {
          return sendError(res, HTTP_STATUS.CONFLICT, 'Username is already taken');
        }
        profileUpdates.username = uname;
      }
    }

    if (profession !== undefined) profileUpdates.profession = String(profession).trim();
    if (location !== undefined) profileUpdates.location = String(location).trim();
    if (about !== undefined) {
      if (typeof about === 'string' && about.length > 500) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'About must be at most 500 characters');
      }
      profileUpdates.bio = String(about ?? '').slice(0, 500);
    }

    if (dailyRate !== undefined) {
      if (dailyRate === null) {
        userUpdates.dailyRate = null;
      } else {
        const rate = Number(dailyRate);
        if (Number.isNaN(rate) || rate < 0 || rate > 999999) {
          return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Daily rate must be between 0 and 999999');
        }
        userUpdates.dailyRate = Math.round(rate);
      }
    }

    if (currency !== undefined) {
      const normalized = normalizeCurrency(currency);
      if (!normalized) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid currency');
      }
      userUpdates.currency = normalized;
    }

    // Keep the profile's display name in sync with first/last name.
    if (userUpdates.firstName !== undefined || userUpdates.lastName !== undefined) {
      const fn = userUpdates.firstName ?? user.firstName;
      const ln = userUpdates.lastName ?? user.lastName;
      profileUpdates.fullName = `${fn} ${ln}`.trim();
    }

    if (Object.keys(userUpdates).length) await user.update(userUpdates);
    if (Object.keys(profileUpdates).length) await profile.update(profileUpdates);

    const fresh = await db.Profile.findByPk(profile.id);
    return sendSuccess(res, 'Profile updated', shapeSettings(await db.User.findByPk(user.id), fresh));
  });

  // PATCH /worker/profile/avatar — multipart, field "avatar".
  uploadAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No image uploaded');
    const profile = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const avatarUrl = getFileUrl(req.file.filename, 'avatar');
    await profile.update({ avatarUrl });
    return sendSuccess(res, 'Photo updated', { avatarUrl });
  });

  // DELETE /worker/profile/avatar
  deleteAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    await profile.update({ avatarUrl: null });
    return sendSuccess(res, 'Photo removed', { avatarUrl: null });
  });

  // PATCH /worker/account/email
  updateEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const email = String(req.body.email ?? '').trim().toLowerCase();
    if (!isValidEmail(email)) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
    const user = await db.User.findByPk(req.user!.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    if (email !== user.email) {
      const existing = await db.User.findOne({ where: { email } });
      if (existing && existing.id !== user.id) {
        return sendError(res, HTTP_STATUS.CONFLICT, 'Email already in use');
      }
      await user.update({ email, emailVerified: false });
    }
    return sendSuccess(res, 'Email updated', { email, emailVerified: user.emailVerified });
  });

  // POST /worker/account/email/verify — send a verification code to the email.
  verifyEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await db.User.findByPk(req.user!.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    if (user.emailVerified) return sendSuccess(res, 'Email already verified');
    await OTPService.generateOTP(user.email, 'verification');
    return sendSuccess(res, 'Verification email sent');
  });

  // PATCH /worker/account/phone
  updatePhone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const raw = String(req.body.phone ?? '').trim();
    const phone = raw.replace(/[\s-]/g, '');
    if (phone.length < 7) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid phone number');
    const user = await db.User.findByPk(req.user!.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    await user.update({ phoneNumber: phone, isPhoneVerified: false });
    return sendSuccess(res, 'Phone number updated', { phone, phoneVerified: false });
  });

  // POST /worker/account/phone/verify — send a verification code.
  // SMS isn't wired yet, so the code is delivered to the account email (the
  // same channel password reset uses).
  verifyPhone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await db.User.findByPk(req.user!.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    if (!user.phoneNumber) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Add a phone number first');
    if (user.isPhoneVerified) return sendSuccess(res, 'Phone already verified');
    await OTPService.generateOTP(user.email, 'verification');
    return sendSuccess(res, 'Verification code sent');
  });

  // PATCH /worker/account/password
  updatePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'currentPassword and newPassword are required');
    }
    if (String(newPassword).length < 8) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'New password must be at least 8 characters');
    }
    try {
      await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
      return sendSuccess(res, 'Password changed');
    } catch (err: any) {
      if (err?.message === 'Current password is incorrect') {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect');
      }
      throw err;
    }
  });

  // POST /worker/account/google/disconnect — no Google linking is stored yet.
  disconnectGoogle = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No Google account is linked to this account');
  });

  // PATCH /worker/notifications — merge the posted keys into the JSON blob.
  updateNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const current = mergeDefaults(DEFAULT_NOTIFICATIONS, profile.notificationSettings);
    for (const key of Object.keys(DEFAULT_NOTIFICATIONS)) {
      if (key in req.body) (current as Json)[key] = !!req.body[key];
    }
    await profile.update({ notificationSettings: current });
    return sendSuccess(res, 'Notifications updated', current);
  });

  // PATCH /worker/privacy — maps onto existing columns + the new toggles.
  updatePrivacy = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const map: Record<string, string> = {
      publicProfile: 'profilePublic',
      showPhone: 'showPhone',
      showRate: 'showRate',
      showOnline: 'showOnline',
      allowDirectMessages: 'allowDirectMessages',
      appearInSearch: 'appearInSearch',
    };
    const updates: Record<string, any> = {};
    for (const [bodyKey, column] of Object.entries(map)) {
      if (bodyKey in req.body) updates[column] = !!req.body[bodyKey];
    }
    if (Object.keys(updates).length) await profile.update(updates);
    return sendSuccess(res, 'Privacy settings updated', req.body);
  });

  // PATCH /worker/account/pause — hide from search + stop requests, reversibly.
  pauseAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    await profile.update({ profilePublic: false, appearInSearch: false, isAvailable: false });
    return sendSuccess(res, 'Account paused', { paused: true });
  });

  // POST /worker/account/export — download all of the user's data as JSON.
  exportData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user, profile } = await loadUserAndProfile(req);
    if (!user || !profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const [jobs, conversations] = await Promise.all([
      db.JobRequest.findAll({ where: { workerId: profile.id }, order: [['createdAt', 'DESC']] }),
      db.Conversation.findAll({
        where: { [Op.or]: [{ participant1Id: profile.id }, { participant2Id: profile.id }] },
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      account: { ...user.toJSON() },
      profile: profile.get({ plain: true }),
      settings: shapeSettings(user, profile),
      jobHistory: jobs.map((j: any) => j.get({ plain: true })),
      conversationCount: conversations.length,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="fundi-data-export.json"');
    return res.status(HTTP_STATUS.OK).send(JSON.stringify(payload, null, 2));
  });

  // DELETE /worker/account — permanent deletion (cascades to the profile).
  deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      await AuthService.deleteAccount(req.user!.id, 'Deleted from worker settings');
      return sendSuccess(res, 'Account deleted');
    } catch (err: any) {
      if (err?.message === 'User not found') {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
      }
      throw err;
    }
  });
}

export default new WorkerSettingsController();
