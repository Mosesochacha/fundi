import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { cleanupFile } from '../middleware/upload';
import cloudinaryService from '../services/cloudinary.service';

class PhotosController {
  uploadAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No file uploaded');

    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) {
      cleanupFile(req.file.path);
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    }

    // Delete old Cloudinary image
    if (profile.avatarUrl) {
      const publicId = cloudinaryService.extractPublicId(profile.avatarUrl);
      if (publicId) cloudinaryService.deleteImage(publicId).catch(() => {});
    }

    const cloudUrl = await cloudinaryService.uploadImage(req.file.path, 'avatars', { width: 400 });
    if (!cloudUrl) {
      cleanupFile(req.file.path);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to upload image');
    }

    await profile.update({ avatarUrl: cloudUrl });
    return sendSuccess(res, 'Profile photo updated', { avatarUrl: cloudUrl });
  });

  removeAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    if (profile.avatarUrl) {
      const publicId = cloudinaryService.extractPublicId(profile.avatarUrl);
      if (publicId) cloudinaryService.deleteImage(publicId).catch(() => {});
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

    if (profile.bannerUrl) {
      const publicId = cloudinaryService.extractPublicId(profile.bannerUrl);
      if (publicId) cloudinaryService.deleteImage(publicId).catch(() => {});
    }

    const cloudUrl = await cloudinaryService.uploadImage(req.file.path, 'banners', { width: 1200 });
    if (!cloudUrl) {
      cleanupFile(req.file.path);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to upload image');
    }

    await profile.update({ bannerUrl: cloudUrl });
    return sendSuccess(res, 'Banner updated', { bannerUrl: cloudUrl });
  });

  removeBanner = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    if (profile.bannerUrl) {
      const publicId = cloudinaryService.extractPublicId(profile.bannerUrl);
      if (publicId) cloudinaryService.deleteImage(publicId).catch(() => {});
    }

    await profile.update({ bannerUrl: null });
    return sendSuccess(res, 'Banner removed');
  });

  uploadWorkPhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No file uploaded');

    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) {
      cleanupFile(req.file.path);
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');
    }

    const workPhotos: string[] = Array.isArray(profile.workPhotos) ? profile.workPhotos : [];
    if (workPhotos.length >= 6) {
      cleanupFile(req.file.path);
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Maximum 6 work photos allowed');
    }

    const cloudUrl = await cloudinaryService.uploadImage(req.file.path, 'work', { width: 1200 });
    if (!cloudUrl) {
      cleanupFile(req.file.path);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to upload image');
    }

    workPhotos.push(cloudUrl);
    await profile.update({ workPhotos });
    return sendSuccess(res, 'Work photo uploaded', { url: cloudUrl, workPhotos });
  });

  removeWorkPhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const index = parseInt(req.params.index, 10);
    if (isNaN(index) || index < 0) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid index');

    const profile: any = await db.Profile.findOne({ where: { userId: req.user!.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const workPhotos: string[] = Array.isArray(profile.workPhotos) ? [...profile.workPhotos] : [];
    if (index >= workPhotos.length) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Photo not found');

    const removedUrl = workPhotos[index];
    const publicId = cloudinaryService.extractPublicId(removedUrl);
    if (publicId) cloudinaryService.deleteImage(publicId).catch(() => {});

    workPhotos.splice(index, 1);
    await profile.update({ workPhotos });
    return sendSuccess(res, 'Work photo removed', { workPhotos });
  });
}

export default new PhotosController();
