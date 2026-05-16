import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import logger from '../utils/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  private isConfigured(): boolean {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  }

  async uploadImage(
    localPath: string,
    folder: string,
    options: { width?: number; quality?: number } = {}
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      logger.warn('[Cloudinary] Not configured — returning null');
      return null;
    }
    try {
      const result = await cloudinary.uploader.upload(localPath, {
        folder: `fundi/${folder}`,
        transformation: [
          { width: options.width ?? 1200, crop: 'limit' },
          { quality: options.quality ?? 85 },
          { fetch_format: 'auto' },
        ],
      });
      fs.unlink(localPath, () => {});
      return result.secure_url;
    } catch (err: unknown) {
      logger.error('[Cloudinary] Upload failed', { folder, error: (err as Error).message });
      return null;
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err: unknown) {
      logger.warn('[Cloudinary] Delete failed', { publicId, error: (err as Error).message });
    }
  }

  extractPublicId(url: string): string | null {
    try {
      const match = url.match(/fundi\/[^/]+\/[^.]+/);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  }
}

export default new CloudinaryService();
