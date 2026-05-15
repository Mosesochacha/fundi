import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Common validation rules
 */
export const commonValidations = {
  uuid: (field: string): ValidationChain =>
    param(field).isUUID().withMessage(`${field} must be a valid UUID`),

  email: (field: string = 'email'): ValidationChain =>
    body(field).isEmail().normalizeEmail().withMessage('Must be a valid email'),

  password: (field: string = 'password'): ValidationChain =>
    body(field)
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),

  businessId: (): ValidationChain =>
    query('businessId').isUUID().withMessage('Business ID must be a valid UUID'),

  pagination: (): ValidationChain[] => [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],

  dateRange: (): ValidationChain[] => [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],

  amount: (field: string): ValidationChain =>
    body(field)
      .isFloat({ min: 0 })
      .withMessage(`${field} must be a positive number`),

  required: (field: string): ValidationChain =>
    body(field).notEmpty().withMessage(`${field} is required`),

  optional: (field: string): ValidationChain =>
    body(field).optional(),
};

/**
 * User validation rules
 */
export const userValidations = {
  register: [
    commonValidations.required('firstName'),
    commonValidations.required('lastName'),
    commonValidations.email(),
    commonValidations.password(),
    body('username').optional().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
    body('role').optional().isIn(['fan', 'creator']).withMessage('Role must be fan or creator'),
  ],

  login: [
    commonValidations.email(),
    commonValidations.required('password'),
  ],

  updateProfile: [
    body('firstName').optional().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').optional().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('username').optional().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
    commonValidations.email().optional(),
  ],

  changePassword: [
    commonValidations.required('currentPassword'),
    commonValidations.password('newPassword'),
  ],
};

/**
 * Business validation rules
 */
export const businessValidations = {
  create: [
    commonValidations.required('name'),
    commonValidations.required('kraPin'),
    commonValidations.required('fiscalCalendarStart'),
    body('kraPin').isLength({ min: 11, max: 11 }).withMessage('KRA PIN must be 11 characters'),
    body('fiscalCalendarStart').isISO8601().withMessage('Fiscal calendar start must be a valid date'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  ],

  update: [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('kraPin').optional().isLength({ min: 11, max: 11 }).withMessage('KRA PIN must be 11 characters'),
    body('fiscalCalendarStart').optional().isISO8601().withMessage('Fiscal calendar start must be a valid date'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  ],
};

/**
 * Product validation rules
 */
export const productValidations = {
  create: [
    commonValidations.businessId(),
    commonValidations.required('name'),
    commonValidations.required('type'),
    commonValidations.amount('unitPrice'),
    body('type').isIn(['Good', 'Service']).withMessage('Type must be Good or Service'),
    body('taxable').isBoolean().withMessage('Taxable must be a boolean'),
    body('taxRate').isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  ],

  update: [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('type').optional().isIn(['Good', 'Service']).withMessage('Type must be Good or Service'),
    body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be positive'),
    body('taxable').optional().isBoolean().withMessage('Taxable must be a boolean'),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  ],
};

/**
 * Invoice validation rules
 */
export const invoiceValidations = {
  create: [
    commonValidations.businessId(),
    commonValidations.required('customerId'),
    commonValidations.required('date'),
    commonValidations.required('dueDate'),
    commonValidations.required('items'),
    body('customerId').isUUID().withMessage('Customer ID must be a valid UUID'),
    body('date').isISO8601().withMessage('Date must be a valid date'),
    body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  ],

  recordPayment: [
    commonValidations.amount('amount'),
    commonValidations.required('paymentDate'),
    commonValidations.required('paymentMethod'),
    body('paymentDate').isISO8601().withMessage('Payment date must be a valid date'),
    body('paymentMethod').isIn(['Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Card'])
      .withMessage('Invalid payment method'),
  ],
};

/**
 * Journal entry validation rules
 */
export const journalEntryValidations = {
  create: [
    commonValidations.businessId(),
    commonValidations.required('date'),
    commonValidations.required('description'),
    commonValidations.required('ledgerEntries'),
    body('date').isISO8601().withMessage('Date must be a valid date'),
    body('ledgerEntries').isArray({ min: 2 }).withMessage('Ledger entries must have at least 2 entries'),
  ],
};