import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

export const validateBugReport = [
  body('bugDescription')
    .isString()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Bug description must be between 10 and 5000 characters'),
  body('pageUrl')
    .optional()
    .custom((value) => {
      if (!value || value === null || value === '') return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage('Page URL must be a valid URL'),
  body('screenshots')
    .optional()
    .isArray()
    .withMessage('Screenshots must be an array'),
  body('screenshots.*.name')
    .optional()
    .isString()
    .withMessage('Screenshot name must be a string'),
  body('screenshots.*.url')
    .optional()
    .isString()
    .withMessage('Screenshot URL must be a string'),
  body('screenshots.*.type')
    .optional()
    .isString()
    .withMessage('Screenshot type must be a string'),
  body('userAgent')
    .optional()
    .isString()
    .withMessage('User agent must be a string'),
  body('userId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    })
    .withMessage('User ID must be a valid UUID'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Email must be a valid email address'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
];

export const validateContact = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

export const validateBugReportUpdate = [
  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'resolved', 'closed'])
    .withMessage('Status must be one of: open, in-progress, resolved, closed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
];

export const validateChatMessage = [
  body('messages')
    .isArray()
    .withMessage('Messages must be an array')
    .isLength({ min: 1 })
    .withMessage('At least one message is required'),
  body('messages.*.role')
    .isIn(['user', 'assistant', 'system'])
    .withMessage('Message role must be user, assistant, or system'),
  body('messages.*.content')
    .isString()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message content must be a string between 1 and 10000 characters'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateEmailTrackingStats = [
  query('period').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid period'),
  query('emailType').optional().isIn(['all', 'newsletter', 'promotional', 'transactional']).withMessage('Invalid email type')
];

export const validateEmailTrackingCampaigns = [
  query('period').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid period'),
  query('emailType').optional().isIn(['all', 'newsletter', 'promotional', 'transactional']).withMessage('Invalid email type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
];

export const validateEmailTracking = [
  body('emailId').notEmpty().withMessage('Email ID is required'),
  body('recipientEmail').isEmail().withMessage('Valid recipient email is required'),
  body('eventType').isIn(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained']).withMessage('Invalid event type'),
  body('newsletterId').optional().isInt({ min: 1 }).withMessage('Invalid newsletter ID'),
  body('recipientId').optional().isInt({ min: 1 }).withMessage('Invalid recipient ID'),
  body('eventData').optional().isObject().withMessage('Event data must be an object'),
  body('userAgent').optional().isString().withMessage('User agent must be a string'),
  body('ipAddress').optional().isIP().withMessage('Invalid IP address')
];

export const validateEmailTrackingDetails = [
  param('emailId').notEmpty().withMessage('Email ID is required')
];

export const validateNewsletterList = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'scheduled', 'sent', 'cancelled']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string')
];

export const validateNewsletterId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid newsletter ID')
];

export const validateNewsletterCreate = [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('scheduledFor').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return new Date(value).toISOString() === value;
  }).withMessage('Invalid scheduled date'),
  body('recipients').optional().isInt({ min: 0 }).withMessage('Recipients must be a non-negative integer')
];

export const validateNewsletterUpdate = [
  param('id').isInt({ min: 1 }).withMessage('Invalid newsletter ID'),
  body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('scheduledFor').optional().isISO8601().withMessage('Invalid scheduled date'),
  body('status').optional().isIn(['draft', 'scheduled', 'sent', 'cancelled']).withMessage('Invalid status')
];

export const validateNewsletterStats = [
  query('period').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid period')
];

export const validateClick = [
  body('eventType')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Event type is required'),
  body('deviceId')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID is required'),
  body('sessionId')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Session ID is required'),
  body('userId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('opportunityId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Opportunity ID must be a valid UUID'),
  body('pagePath')
    .optional({ nullable: true })
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Page path must be between 1 and 500 characters'),
  body('metadata')
    .optional({ nullable: true })
    .isObject()
    .withMessage('Metadata must be an object'),
];

export const validateDomain = [
  body('domain').notEmpty().withMessage('Domain is required')
];

export const validateSlug = [
  body('slug').notEmpty().withMessage('Slug is required')
];

export const validateSearch = [
  query('q').notEmpty().withMessage('Search term is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const validateNotificationSettings = [
  body('pushNotifications').optional().isObject().withMessage('Push notifications must be an object'),
  body('emailNotifications').optional().isObject().withMessage('Email notifications must be an object'),
  body('smsNotifications').optional().isObject().withMessage('SMS notifications must be an object'),
];

export const validateApplicationMatch = [
  body('applicationData').isObject().withMessage('Application data is required'),
  body('applicationData.content').isString().notEmpty().withMessage('Application content is required'),
  body('opportunityId').optional().isString().withMessage('Opportunity ID must be a string')
];

export const validateEligibilityCheck = [
  body('applicationData').isObject().withMessage('Application data is required'),
  body('applicationData.content').isString().notEmpty().withMessage('Application content is required'),
  body('opportunityId').isString().withMessage('Opportunity ID is required and must be a string')
];

