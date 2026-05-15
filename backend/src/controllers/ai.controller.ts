import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { polishPost } from '../services/groq.service';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

class AiController {
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
