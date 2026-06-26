import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS, normalizeCurrency } from '../utils/constants';
import { symbolForCurrency } from '../utils/currencyMap';

async function loadUserAndProfile(userId: string) {
  const user = await db.User.findByPk(userId);
  const profile = await db.Profile.findOne({ where: { userId } });
  return { user, profile };
}

class OnboardingController {
  /** PATCH /worker/onboarding — { trade, location, dailyRate? } */
  completeWorker = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const tradesInput = Array.isArray(req.body.trades)
      ? (req.body.trades as unknown[]).map((t) => String(t).trim()).filter(Boolean)
      : [];
    const legacyTrade = String(req.body.trade ?? '').trim();
    const trades = Array.from(
      new Set(tradesInput.length ? tradesInput : legacyTrade ? [legacyTrade] : []),
    );
    const location = String(req.body.location ?? '').trim();
    const rawRate = req.body.dailyRate;
    if (!trades.length)
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'at least one trade is required');
    if (!location) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'location is required');

    const { user, profile } = await loadUserAndProfile(userId);
    if (!user || !profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Account not found');

    const dailyRate =
      rawRate === undefined || rawRate === null || rawRate === ''
        ? user.dailyRate
        : Number(String(rawRate).replace(/[^0-9.]/g, '')) || null;

    const rawCurrency = req.body.currency;
    let currency = user.currency;
    if (rawCurrency !== undefined && rawCurrency !== null && rawCurrency !== '') {
      const normalized = normalizeCurrency(rawCurrency);
      if (!normalized) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid currency');
      currency = normalized;
    }
    const currencySymbol =
      String(req.body.currencySymbol || '').trim() || symbolForCurrency(currency);

    await user.update({
      accountType: 'worker',
      dailyRate,
      currency,
      currencySymbol,
      isProfileComplete: true,
      isOnboarded: true,
    });
    await profile.update({ profession: trades[0], services: trades, location });

    return sendSuccess(res, 'Onboarding complete', {
      user: user.toJSON(),
      profile: profile.toJSON(),
    });
  });

  /** PATCH /employer/onboarding — { location, interestedTrades?: string[] } */
  completeEmployer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const location = String(req.body.location ?? '').trim();
    const interestedTrades = Array.isArray(req.body.interestedTrades)
      ? (req.body.interestedTrades as unknown[]).map((t) => String(t).trim()).filter(Boolean)
      : [];
    if (!location) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'location is required');

    const { user, profile } = await loadUserAndProfile(userId);
    if (!user || !profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Account not found');

    const rawCurrency = req.body.currency;
    let currency = user.currency;
    if (rawCurrency !== undefined && rawCurrency !== null && rawCurrency !== '') {
      const normalized = normalizeCurrency(rawCurrency);
      if (!normalized) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid currency');
      currency = normalized;
    }
    const currencySymbol =
      String(req.body.currencySymbol || '').trim() || symbolForCurrency(currency);

    await user.update({
      accountType: 'employer',
      interestedTrades,
      currency,
      currencySymbol,
      isProfileComplete: true,
      isOnboarded: true,
    });
    await profile.update({ location });

    return sendSuccess(res, 'Onboarding complete', {
      user: user.toJSON(),
      profile: profile.toJSON(),
    });
  });
}

export default new OnboardingController();
