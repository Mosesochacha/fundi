import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { polishPost, findFundi } from '../services/groq.service';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

class AiController {
  // Public — powers the "Ask AI" modal on /browse. No auth required.
  findFundi = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = String(req.body?.query ?? '').trim();
    if (!query) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'query is required');
    }
    if (query.length > 1000) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'query is too long');
    }

    try {
      const answer = await findFundi(query);
      return sendSuccess(res, 'Success', { answer });
    } catch {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'The assistant is unavailable right now. Please try again.',
      );
    }
  });

  polishPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roughText, profession, postType } = req.body;
    if (!roughText?.trim()) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'roughText is required');
    }

    try {
      const content = await polishPost(
        roughText,
        profession || 'professional',
        postType || 'SHOWCASE',
      );
      return sendSuccess(res, 'Success', { content });
    } catch {
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'AI assist failed. Please try again.');
    }
  });
}

export default new AiController();
