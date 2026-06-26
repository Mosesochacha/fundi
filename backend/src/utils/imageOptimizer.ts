import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import logger from './logger';

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'avif';
}

/**
 * Optimize an image file using sharp
 * @param inputPath - Path to the input image file
 * @param outputPath - Path where optimized image should be saved
 * @param options - Optimization options
 * @returns Promise with optimized file info
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: OptimizeOptions = {}
): Promise<{ success: boolean; originalSize: number; optimizedSize: number; savedBytes: number }> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'jpeg'
  } = options;

  try {
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const isSamePath = path.resolve(inputPath) === path.resolve(outputPath);
    const writePath = isSamePath ? outputPath + '.tmp' : outputPath;

    let sharpInstance = sharp(inputPath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (format === 'avif') {
      sharpInstance = sharpInstance.avif({ quality });
    } else {
      sharpInstance = sharpInstance.jpeg({
        quality,
        mozjpeg: true,
        progressive: true
      });
    }

    await sharpInstance.toFile(writePath);

    if (isSamePath) {
      fs.renameSync(writePath, outputPath);
    }

    const optimizedStats = fs.statSync(outputPath);
    const optimizedSize = optimizedStats.size;
    const savedBytes = originalSize - optimizedSize;

    logger.info('Image optimized', {
      inputPath,
      outputPath,
      originalSize,
      optimizedSize,
      savedBytes,
      compressionRatio: ((savedBytes / originalSize) * 100).toFixed(2) + '%'
    });

    return {
      success: true,
      originalSize,
      optimizedSize,
      savedBytes
    };
  } catch (error: any) {
    logger.error('Image optimization failed', {
      inputPath,
      outputPath,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Optimize banner image specifically (16:9 aspect ratio, optimized for web)
 */
export async function optimizeBannerImage(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; originalSize: number; optimizedSize: number; savedBytes: number }> {
  return optimizeImage(inputPath, outputPath, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'jpeg'
  });
}

