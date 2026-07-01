import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { optimizeBannerImage } from '../utils/imageOptimizer';
import logger from '../utils/logger';

const uploadDirs = ['uploads/avatars', 'uploads/documents', 'uploads/receipts', 'uploads/temp', 'uploads/logos', 'uploads/banners', 'uploads/log', 'uploads/banner', 'uploads/work', 'uploads/messages'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const allowedImageTypes = /jpeg|jpg|png|gif|webp|ico/;
const allowedDocumentTypes = /pdf|doc|docx|xls|xlsx|csv/;

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let uploadPath = 'uploads/temp';
    
    if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/avatars';
    } else if (file.fieldname === 'receipt') {
      uploadPath = 'uploads/receipts';
    } else if (file.fieldname === 'document') {
      uploadPath = 'uploads/documents';
    } else if (file.fieldname === 'logo') {
      uploadPath = 'uploads/logos';
    } else if (file.fieldname === 'banner') {
      uploadPath = 'uploads/banners';
    } else if (file.fieldname === 'work') {
      uploadPath = 'uploads/work';
    } else if (file.fieldname === 'message') {
      uploadPath = 'uploads/messages';
    } else if (file.fieldname === 'favicon') {
      uploadPath = 'uploads/favicons';
    }
    
    cb(null, path.join(__dirname, '..', '..', uploadPath));
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${uniqueSuffix}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (file.fieldname === 'avatar' || file.fieldname === 'logo' || file.fieldname === 'banner' || file.fieldname === 'favicon' || file.fieldname === 'work' || file.fieldname === 'message') {
    if (allowedImageTypes.test(extname) && (mimetype.startsWith('image/') || mimetype === 'image/vnd.microsoft.icon')) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP, ICO) are allowed'));
    }
  } else if (file.fieldname === 'receipt') {
    if ((allowedImageTypes.test(extname) && mimetype.startsWith('image/')) || 
        (extname === '.pdf' && mimetype === 'application/pdf')) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files and PDFs are allowed for receipts'));
    }
  } else if (file.fieldname === 'document') {
    if (allowedDocumentTypes.test(extname)) {
      return cb(null, true);
    } else {
      return cb(new Error('Only document files (PDF, DOC, DOCX, XLS, XLSX, CSV) are allowed'));
    }
  }
  
  cb(new Error('Invalid file field'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
});

const optimizeBannerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (req.file && req.file.fieldname === 'banner') {
    const originalPath = req.file.path;
    const originalSize = req.file.size;

    try {
      const optimizedResult = await optimizeBannerImage(originalPath, originalPath);
      
      req.file.size = optimizedResult.optimizedSize;
      
      logger.info('Banner image optimized in middleware', {
        filename: req.file.filename,
        originalSize,
        optimizedSize: optimizedResult.optimizedSize,
        savedBytes: optimizedResult.savedBytes,
        compressionRatio: ((optimizedResult.savedBytes / originalSize) * 100).toFixed(2) + '%'
      });
    } catch (optimizeError: any) {
      logger.warn('Banner optimization failed in middleware, using original', {
        filename: req.file.filename,
        error: optimizeError.message
      });
    }
  }
  next();
};

export const uploadAvatar = upload.single('avatar');
export const uploadReceipt = upload.single('receipt');
export const uploadDocument = upload.single('document');
export const uploadLogo = upload.single('logo');

export const uploadBanner = (req: Request, res: Response, next: NextFunction) => {
  const multerMiddleware = upload.single('banner');
  multerMiddleware(req, res, (err: any) => {
    if (err) {
      return next(err);
    }
    optimizeBannerMiddleware(req, res, next);
  });
};

export const uploadFavicon = upload.single('favicon');
export const uploadWork = upload.single('work');
export const uploadMessageImage = upload.single('message');
export const uploadMultiple = upload.array('files', 5);

export const cleanupFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {}
};

export const getFileUrl = (filename: string, type: 'avatar' | 'receipt' | 'document' | 'logo' | 'banner' | 'favicon' | 'work' = 'avatar'): string => {
  const baseUrl = process.env.BASE_URL;
  let folder = 'avatars';
  
  switch (type) {
    case 'avatar':
      folder = 'avatars';
      break;
    case 'receipt':
      folder = 'receipts';
      break;
    case 'document':
      folder = 'documents';
      break;
    case 'logo':
      folder = 'logos';
      break;
    case 'banner':
      folder = 'banners';
      break;
    case 'favicon':
      folder = 'favicons';
      break;
    case 'work':
      folder = 'work';
      break;
  }

  return `${baseUrl}/uploads/${folder}/${filename}`;
};

export default upload;