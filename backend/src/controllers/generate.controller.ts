import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { generateProfile as groqGenerateProfile } from '../services/groq.service';

class GenerateController {
  generateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { fullName, profession, location, yearsExperience, differentiator } = req.body;
    if (!profession?.trim()) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'profession is required');
    }

    try {
      const result = await groqGenerateProfile({ fullName, profession, location, yearsExperience, differentiator });
      return sendSuccess(res, 'Profile generated', result);
    } catch {
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'AI generation failed. Please try again.');
    }
  });
}

export default new GenerateController();
