import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { FeedService } from '../services/feed.service';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

class FeedController {
  getFeed = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const type       = req.query.type       as string | undefined;
    const dateRange  = req.query.dateRange  as string | undefined;
    const profession = req.query.profession as string | undefined;
    const location   = req.query.location   as string | undefined;
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    try {
      const result = await FeedService.getFeed({
        type,
        dateRange,
        profession,
        location,
        page,
        limit,
        profileId: req.user?.profileId,
      });
      return sendSuccess(res, 'Feed retrieved', result);
    } catch (err) {
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to load feed');
    }
  });
}

export default new FeedController();
