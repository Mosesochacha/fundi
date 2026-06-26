export type RequestStatus = "new" | "active" | "completed" | "declined";

/** The status filter tabs, plus the catch-all "all". */
export type RequestFilter = "all" | RequestStatus;

export type SortOption = "newest" | "oldest" | "scheduled" | "rate";

export interface RequestEmployer {
  id: string;
  name: string;
  initials: string;
  /** CSS colour for the avatar background. */
  avatarColor: string;
  totalHires: number;
  /** null for an employer with no completed-hire ratings yet. */
  rating: number | null;
}

export interface RequestReview {
  /** 1–5. */
  rating: number;
  text: string;
  /** ISO date string. */
  createdAt: string;
}

export interface JobRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  /** ISO date string for when the job is scheduled. */
  scheduledAt: string;
  /** Human label, e.g. "About 4 hours" or "2 days". */
  estimatedDuration: string;
  location: string;
  agreedRate: number;
  /** Active job scheduled for today (drives the "Today" badge). */
  isToday: boolean;
  /** Active job spanning more than one day (drives "In progress"). */
  isMultiDay: boolean;
  dayProgress?: { current: number; total: number };
  tags: string[];
  employer: RequestEmployer;
  /** Present once the employer has left a review on a completed job. */
  review?: RequestReview;
  /** ISO date string for when the request was created (drives "time ago"). */
  createdAt: string;
}

export interface RequestStats {
  new: number;
  active: number;
  completed: number;
  declined: number;
  total: number;
}

export const EMPTY_STATS: RequestStats = {
  new: 0,
  active: 0,
  completed: 0,
  declined: 0,
  total: 0,
};
