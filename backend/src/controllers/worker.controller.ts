import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import db from '../models';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { getFileUrl } from '../middleware/upload';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initialsOf(name?: string | null): string {
  if (!name) return 'U';
  return (
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'U'
  );
}

/** Shape a Profile (+ its User) into the WorkerProfileData the client expects. */
function shapeProfile(profile: any, user: any) {
  return {
    id: profile.id,
    name: profile.fullName,
    initials: initialsOf(profile.fullName),
    trade: profile.profession,
    yearsExperience: profile.yearsExperience ?? 0,
    location: profile.location,
    currency: 'KSh',
    isVerified: !!user?.isPhoneVerified,
    isAvailable: profile.isAvailable ?? true,
    phoneVerified: !!user?.isPhoneVerified,
    // Reviews/ratings/jobs aren't tracked yet — return empty/zero, not fake data.
    rating: 0,
    reviewCount: 0,
    jobsDone: 0,
    ratingBreakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 })),
    reviews: [],
    dailyRate: user?.dailyRate ?? 0,
    about: profile.bio ?? '',
    services: profile.services ?? [],
    serviceAreas: profile.serviceAreas ?? [],
    portfolio: profile.portfolio ?? [],
    experience: profile.experience ?? [],
    certifications: profile.certifications ?? [],
    education: profile.education ?? [],
  };
}

/** Resolve the authenticated user's profile, or null. */
async function getOwnProfile(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) return null;
  return db.Profile.findOne({ where: { userId } });
}

class WorkerController {
  // ── Reads ──────────────────────────────────────────────────────────────────
  // GET /browse/workers — public directory of skilled workers, with filters.
  // Query: trades (csv/array), location, minRate, maxRate, minRating, minExp,
  // available, verified, certified, sort, page, limit.
  browseWorkers = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query;
    const toArray = (v: unknown): string[] =>
      Array.isArray(v)
        ? (v as string[])
        : typeof v === 'string' && v.length
          ? v.split(',')
          : [];
    const trades = toArray(q.trades ?? (q as any)['trades[]'])
      .map((t) => t.trim())
      .filter(Boolean);
    const location = ((q.location as string) || '').trim();
    const minRate = Number(q.minRate) || 0;
    const maxRate = Number(q.maxRate) || 0;
    const minExp = Number(q.minExp) || 0;
    const available = q.available === 'true' || q.available === '1';
    const verified = q.verified === 'true' || q.verified === '1';
    const certified = q.certified === 'true' || q.certified === '1';
    const sort = (q.sort as string) || 'best_match';
    const page = Math.max(1, parseInt(q.page as string) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(q.limit as string) || 12));
    const offset = (page - 1) * limit;

    const where: any = { profilePublic: true, appearInSearch: true };
    if (trades.length) {
      where[Op.or] = trades.map((t) => ({ profession: { [Op.iLike]: t } }));
    }
    if (location) where.location = { [Op.iLike]: `%${location}%` };
    if (available) where.isAvailable = true;
    if (minExp > 0) where.yearsExperience = { [Op.gte]: minExp };

    // User-level filters (rate, verification) live on the joined User row.
    const userWhere: any = {};
    if (verified) userWhere.isPhoneVerified = true;
    if (minRate > 0 || maxRate > 0) {
      const hi = maxRate > 0 ? maxRate : 1_000_000;
      // Keep workers who priced in-range OR haven't set a rate yet.
      userWhere[Op.or] = [
        { dailyRate: { [Op.between]: [minRate, hi] } },
        { dailyRate: { [Op.is]: null } },
      ];
    }
    const userInclude: any = {
      model: db.User,
      as: 'user',
      attributes: ['dailyRate', 'isPhoneVerified', 'accountType'],
      required: verified, // only force the join when filtering by verification
    };
    if (Object.keys(userWhere).length) {
      userInclude.where = userWhere;
      userInclude.required = true;
    }

    // Sort. Rating/jobs aren't tracked yet, so those fall back to popularity.
    const popularity = db.sequelize.literal(
      '(SELECT COUNT(*) FROM "Follows" WHERE "followingId" = "Profile"."id")'
    );
    let order: any[];
    if (sort === 'rate_asc') order = [[{ model: db.User, as: 'user' }, 'dailyRate', 'ASC']];
    else if (sort === 'rate_desc') order = [[{ model: db.User, as: 'user' }, 'dailyRate', 'DESC']];
    else if (sort === 'most_experienced') order = [['yearsExperience', 'DESC'], [popularity, 'DESC']];
    else order = [[popularity, 'DESC'], ['views', 'DESC']];

    const { count, rows } = await db.Profile.findAndCountAll({
      where,
      include: [userInclude],
      order,
      offset,
      limit,
      distinct: true,
    });

    let workers = rows.map((p: any) => {
      const plain = p.get({ plain: true });
      const user = plain.user || {};
      const certs = Array.isArray(plain.certifications) ? plain.certifications : [];
      return {
        id: plain.id,
        username: plain.username,
        name: plain.fullName,
        initials: initialsOf(plain.fullName),
        trade: plain.profession,
        location: plain.location,
        bio: plain.bio ?? '',
        avatarUrl: plain.avatarUrl ?? null,
        yearsExperience: plain.yearsExperience ?? 0,
        currency: 'KSh',
        dailyRate: user.dailyRate ?? 0,
        isAvailable: plain.isAvailable ?? true,
        isVerified: !!user.isPhoneVerified,
        certified: certs.length > 0,
        // Not tracked yet — surfaced as 0 so the UI can render placeholders.
        rating: 0,
        reviewCount: 0,
        jobsDone: 0,
      };
    });

    if (certified) workers = workers.filter((w: { certified: boolean }) => w.certified);

    return sendSuccess(res, 'Workers found', {
      workers,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  });

  // GET /worker/:id/profile — public. `:id` is a profile id (uuid) or username.
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const where = UUID_RE.test(id) ? { id } : { username: id };
    const profile = await db.Profile.findOne({ where });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Worker not found');
    const user = await db.User.findByPk(profile.userId);
    return sendSuccess(res, 'Worker profile', shapeProfile(profile, user));
  });

  // GET /worker/me/profile — the signed-in worker's own profile.
  getMyProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const user = await db.User.findByPk(profile.userId);
    return sendSuccess(res, 'Profile', shapeProfile(profile, user));
  });

  // ── Simple field updates ────────────────────────────────────────────────────
  updateAbout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { about } = req.body;
    if (typeof about !== 'string') return sendError(res, HTTP_STATUS.BAD_REQUEST, 'about must be a string');
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    await profile.update({ bio: about.slice(0, 2000) });
    return sendSuccess(res, 'About updated', { about: profile.bio });
  });

  updateServices = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { services } = req.body;
    if (!Array.isArray(services) || services.some((s) => typeof s !== 'string')) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'services must be an array of strings');
    }
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const clean = services.map((s: string) => s.trim()).filter(Boolean).slice(0, 40);
    await profile.update({ services: clean });
    return sendSuccess(res, 'Services updated', { services: clean });
  });

  updateRate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const raw = req.body.dailyRate;
    const rate = Number(String(raw).replace(/[^0-9]/g, ''));
    if (Number.isNaN(rate) || rate < 0) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'dailyRate must be a positive number');
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const user = await db.User.findByPk(userId);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    await user.update({ dailyRate: rate });
    return sendSuccess(res, 'Daily rate updated', { dailyRate: rate });
  });

  updateServiceArea = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { areas } = req.body;
    if (!Array.isArray(areas) || areas.some((a) => typeof a !== 'string')) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'areas must be an array of strings');
    }
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const clean = areas.map((a: string) => a.trim()).filter(Boolean).slice(0, 40);
    await profile.update({ serviceAreas: clean });
    return sendSuccess(res, 'Service area updated', { areas: clean });
  });

  // Handles both the Shell footer toggle ({ available }) and the settings
  // Availability panel (the full object). The `available` flag lives on
  // Profile.isAvailable; the rest is merged into the availabilitySettings JSON.
  updateAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const updates: Record<string, any> = {};
    if ('available' in req.body) updates.isAvailable = !!req.body.available;

    const BOOL_KEYS = ['emergencyCallouts', 'weekends'];
    const STR_KEYS = ['workingHoursFrom', 'workingHoursTo', 'maxDistance'];
    const extras: Record<string, unknown> = { ...((profile.availabilitySettings as object) ?? {}) };
    let extrasTouched = false;
    for (const k of BOOL_KEYS) {
      if (k in req.body) { extras[k] = !!req.body[k]; extrasTouched = true; }
    }
    for (const k of STR_KEYS) {
      if (k in req.body) { extras[k] = String(req.body[k]); extrasTouched = true; }
    }
    if (extrasTouched) updates.availabilitySettings = extras;

    if (Object.keys(updates).length) await profile.update(updates);
    return sendSuccess(res, 'Availability updated', {
      available: profile.isAvailable,
      ...extras,
    });
  });

  // ── Portfolio ────────────────────────────────────────────────────────────────
  // POST /worker/profile/photos/upload — upload a work image, return its URL.
  // The client then creates the portfolio item with this URL via addPhoto.
  uploadWorkPhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No image uploaded');
    const url = getFileUrl(req.file.filename, 'work');
    return sendSuccess(res, 'Image uploaded', { url });
  });

  addPhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { url, caption, jobType, isBefore, afterPhotoId } = req.body;
    if (!caption || typeof caption !== 'string') return sendError(res, HTTP_STATUS.BAD_REQUEST, 'caption is required');
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const photo = {
      id: uuidv4(),
      url: typeof url === 'string' ? url : '',
      caption: caption.trim(),
      jobType: typeof jobType === 'string' ? jobType.trim() : '',
      ...(isBefore ? { isBefore: true } : {}),
      ...(afterPhotoId ? { afterPhotoId } : {}),
    };
    const portfolio = [...((profile.portfolio as any[]) ?? []), photo];
    await profile.update({ portfolio });
    return sendSuccess(res, 'Photo added', photo);
  });

  deletePhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { photoId } = req.params;
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const portfolio = ((profile.portfolio as any[]) ?? []).filter((p) => p.id !== photoId);
    await profile.update({ portfolio });
    return sendSuccess(res, 'Photo deleted');
  });

  // ── Experience ─────────────────────────────────────────────────────────────
  addExperience = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, company, startYear, endYear, description } = req.body;
    if (!title || typeof title !== 'string') return sendError(res, HTTP_STATUS.BAD_REQUEST, 'title is required');
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const item = {
      id: uuidv4(),
      title: title.trim(),
      company: typeof company === 'string' ? company.trim() : '',
      startYear: Number(startYear) || new Date().getFullYear(),
      endYear: endYear === null || endYear === undefined || endYear === '' ? null : Number(endYear),
      description: typeof description === 'string' ? description.trim() : '',
    };
    const experience = [item, ...((profile.experience as any[]) ?? [])];
    await profile.update({ experience });
    return sendSuccess(res, 'Experience added', item);
  });

  updateExperience = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const list = ((profile.experience as any[]) ?? []);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Experience not found');
    const { title, company, startYear, endYear, description } = req.body;
    const updated = {
      ...list[idx],
      ...(title !== undefined ? { title: String(title).trim() } : {}),
      ...(company !== undefined ? { company: String(company).trim() } : {}),
      ...(startYear !== undefined ? { startYear: Number(startYear) } : {}),
      ...(endYear !== undefined ? { endYear: endYear === null || endYear === '' ? null : Number(endYear) } : {}),
      ...(description !== undefined ? { description: String(description).trim() } : {}),
    };
    const experience = [...list];
    experience[idx] = updated;
    await profile.update({ experience });
    return sendSuccess(res, 'Experience updated', updated);
  });

  deleteExperience = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const experience = ((profile.experience as any[]) ?? []).filter((e) => e.id !== id);
    await profile.update({ experience });
    return sendSuccess(res, 'Experience deleted');
  });

  // ── Certifications ─────────────────────────────────────────────────────────
  addCertification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, issuingBody, yearIssued, expiryYear, documentUrl } = req.body;
    if (!name || typeof name !== 'string') return sendError(res, HTTP_STATUS.BAD_REQUEST, 'name is required');
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const cert = {
      id: uuidv4(),
      name: name.trim(),
      issuingBody: typeof issuingBody === 'string' ? issuingBody.trim() : '',
      yearIssued: Number(yearIssued) || new Date().getFullYear(),
      ...(expiryYear ? { expiryYear: Number(expiryYear) } : {}),
      ...(documentUrl ? { documentUrl: String(documentUrl) } : {}),
      isVerified: false,
    };
    const certifications = [...((profile.certifications as any[]) ?? []), cert];
    await profile.update({ certifications });
    return sendSuccess(res, 'Certification added', cert);
  });

  deleteCertification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const certifications = ((profile.certifications as any[]) ?? []).filter((c) => c.id !== id);
    await profile.update({ certifications });
    return sendSuccess(res, 'Certification deleted');
  });

  // ── Education ──────────────────────────────────────────────────────────────
  addEducation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, name, institution, startYear, endYear } = req.body;
    if (!name || typeof name !== 'string') return sendError(res, HTTP_STATUS.BAD_REQUEST, 'name is required');
    const t = ['school', 'training', 'course'].includes(type) ? type : 'school';
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const item = {
      id: uuidv4(),
      type: t,
      name: name.trim(),
      institution: typeof institution === 'string' ? institution.trim() : '',
      startYear: Number(startYear) || new Date().getFullYear(),
      endYear: Number(endYear) || new Date().getFullYear(),
    };
    const education = [...((profile.education as any[]) ?? []), item];
    await profile.update({ education });
    return sendSuccess(res, 'Education added', item);
  });

  deleteEducation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const profile = await getOwnProfile(req);
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    const education = ((profile.education as any[]) ?? []).filter((e: any) => e.id !== id);
    await profile.update({ education });
    return sendSuccess(res, 'Education deleted');
  });
}

export default new WorkerController();
