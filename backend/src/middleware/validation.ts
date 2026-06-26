import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/helpers';
import { HTTP_STATUS, USERNAME_CONFIG } from '../utils/constants';

/**
 * Validate registration data
 * Note: Validation is handled in the controller, this middleware is deprecated
 */
export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  next();
};

/**
 * Validate login data
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid email format');
    return;
  }

  next();
};

/**
 * Validate video upload data
 */
export const validateVideoUpload = (req: Request, res: Response, next: NextFunction): void => {
  const { title, videoUrl } = req.body;

  if (!title || !videoUrl) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Title and video URL are required');
    return;
  }

  if (title.length < 3 || title.length > 500) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Title must be 3-500 characters');
    return;
  }

  if (req.body.description && req.body.description.length > 2000) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Description must be less than 2000 characters');
    return;
  }

  if (req.body.hashtags && (!Array.isArray(req.body.hashtags) || req.body.hashtags.length > 10)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Hashtags must be an array with maximum 10 items');
    return;
  }

  next();
};

/**
 * Validate video update data
 */
export const validateVideoUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, description } = req.body;

  if (title && (title.length < 3 || title.length > 500)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Title must be 3-500 characters');
    return;
  }

  if (description && description.length > 2000) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Description must be less than 2000 characters');
    return;
  }

  next();
};

/**
 * Validate live stream creation
 */
export const validateLiveStreamCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { title } = req.body;

  if (!title) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Title is required');
    return;
  }

  if (title.length < 3 || title.length > 500) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Title must be 3-500 characters');
    return;
  }

  next();
};

/**
 * Validate tip sending
 */
export const validateTipSend = (req: Request, res: Response, next: NextFunction): void => {
  const { recipientId, amount, contextType, contextId } = req.body;

  if (!recipientId || !amount) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Recipient ID and amount are required');
    return;
  }

  if (amount <= 0 || amount > 1000) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Amount must be between $1 and $1000');
    return;
  }

  if (contextType && !['video', 'live_stream', 'profile'].includes(contextType)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid context type');
    return;
  }

  if (contextType && contextType !== 'profile' && !contextId) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Context ID is required for video and live stream tips');
    return;
  }

  next();
};

/**
 * Validate withdrawal request
 */
export const validateWithdrawal = (req: Request, res: Response, next: NextFunction): void => {
  const { amount, paymentMethod } = req.body;

  if (!amount || !paymentMethod) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Amount and payment method are required');
    return;
  }

  if (amount <= 0) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Amount must be greater than 0');
    return;
  }

  if (!['bank_transfer', 'mobile_money', 'paypal'].includes(paymentMethod)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid payment method');
    return;
  }

  next();
};

/**
 * Validate profile update data
 */
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { displayName, email, username, role } = req.body;

  if (displayName && (displayName.length < 2 || displayName.length > 100)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'displayName must be 2-100 characters');
    return;
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid email format');
      return;
    }
  }

  if (username) {
    if (!USERNAME_CONFIG.REGEX.test(username)) {
      sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid username format');
      return;
    }

    if (USERNAME_CONFIG.BLOCKED_USERNAMES.some(blocked => 
      username.toLowerCase().includes(blocked)
    )) {
      sendError(res, HTTP_STATUS.BAD_REQUEST, 'Username not allowed');
      return;
    }
  }

  if (role && !['user', 'admin', 'moderator'].includes(role)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid role');
    return;
  }

  next();
};

/**
 * Validate password change data
 */
export const validatePasswordChange = (req: Request, res: Response, next: NextFunction): void => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Current password and new password are required');
    return;
  }

  if (newPassword.length < 6) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'New password must be at least 6 characters');
    return;
  }

  if (currentPassword === newPassword) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'New password must be different from current password');
    return;
  }

  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { page, limit } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Page must be a positive number');
    return;
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Limit must be between 1 and 100');
    return;
  }

  next();
};

/**
 * Validate UUID parameter
 */
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuid || !uuidRegex.test(uuid)) {
      sendError(res, HTTP_STATUS.BAD_REQUEST, `Invalid ${paramName} format`);
      return;
    }

    next();
  };
};

/**
 * Validate search query
 */
export const validateSearch = (req: Request, res: Response, next: NextFunction): void => {
  const { q: searchTerm } = req.query;

  if (!searchTerm || typeof searchTerm !== 'string') {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Search term is required');
    return;
  }

  if (searchTerm.length < 2) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Search term must be at least 2 characters');
    return;
  }

  if (searchTerm.length > 100) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Search term must be less than 100 characters');
    return;
  }

  next();
};

/**
 * Validate role parameter
 */
export const validateRole = (req: Request, res: Response, next: NextFunction): void => {
  const { role } = req.params;

  if (!['fan', 'creator', 'admin'].includes(role)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid role');
    return;
  }

  next();
};

/**
 * Validate comment creation
 */
export const validateComment = (req: Request, res: Response, next: NextFunction): void => {
  const { commentableType, commentableId, content, voiceNoteUrl } = req.body;

  if (!commentableType || !commentableId) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Content type and ID are required');
    return;
  }

  if (!content && !voiceNoteUrl) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Comment content or voice note is required');
    return;
  }

  if (!['video', 'live_stream'].includes(commentableType)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid commentable type');
    return;
  }

  if (content && content.length > 1000) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, 'Comment content must be less than 1000 characters');
    return;
  }

  next();
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};