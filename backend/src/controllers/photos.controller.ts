import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { getFileUrl, cleanupFile } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

class PhotosController {
  uploadAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No file uploaded');

    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) {
      cleanupFile(req.file.path);
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    }

    // Delete old avatar file if it's a local file
    if (profile.avatarUrl) {
      const oldFilename = path.basename(profile.avatarUrl);
      const oldPath = path.join(__dirname, '..', '..', 'uploads', 'avatars', oldFilename);
      cleanupFile(oldPath);
    }

    const avatarUrl = getFileUrl(req.file.filename, 'avatar');
    await profile.update({ avatarUrl });

    return sendSuccess(res, 'Profile photo updated', { avatarUrl });
  });

  removeAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    if (profile.avatarUrl) {
      const oldFilename = path.basename(profile.avatarUrl);
      const oldPath = path.join(__dirname, '..', '..', 'uploads', 'avatars', oldFilename);
      cleanupFile(oldPath);
    }

    await profile.update({ avatarUrl: null });
    return sendSuccess(res, 'Profile photo removed');
  });

  uploadBanner = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No file uploaded');

    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) {
      cleanupFile(req.file.path);
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    }

    // Delete old banner file if it's a local file
    if (profile.bannerUrl) {
      const oldFilename = path.basename(profile.bannerUrl);
      const oldPath = path.join(__dirname, '..', '..', 'uploads', 'banners', oldFilename);
      cleanupFile(oldPath);
    }

    const bannerUrl = getFileUrl(req.file.filename, 'banner');
    await profile.update({ bannerUrl });

    return sendSuccess(res, 'Banner updated', { bannerUrl });
  });

  removeBanner = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    if (profile.bannerUrl) {
      const oldFilename = path.basename(profile.bannerUrl);
      const oldPath = path.join(__dirname, '..', '..', 'uploads', 'banners', oldFilename);
      cleanupFile(oldPath);
    }

    await profile.update({ bannerUrl: null });
    return sendSuccess(res, 'Banner removed');
  });
}

export default new PhotosController();
