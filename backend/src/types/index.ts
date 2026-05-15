import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    profileId: string;
    email: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
