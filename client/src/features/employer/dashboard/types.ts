/** Active-job item state on the employer dashboard. */
export type ActiveJobState = "pending" | "today" | "in_progress";

export interface ActiveJob {
  id: string;
  workerId: string;
  workerName: string;
  trade: string;
  avatarUrl: string | null;
  jobType: string;
  location: string;
  state: ActiveJobState;
  /** ISO date - scheduled date, or created date for pending. */
  date: string;
  /** "9:00 AM" style label when scheduled, else null. */
  time: string | null;
  /** Multi-day progress (in_progress only). */
  dayX: number | null;
  dayY: number | null;
  /** True once the scheduled end has passed - gates "Leave review". */
  endPassed: boolean;
  agreedRate: number | null;
}

export interface SuggestedWorker {
  id: string;
  name: string;
  trade: string;
  location: string;
  avatarUrl: string | null;
  /** 0 when no reviews yet. */
  rating: number;
  jobCount: number;
  /** Daily rate in KSh, or null if unset. */
  rate: number | null;
  isVerified: boolean;
}

export interface SpendItem {
  category: string;
  jobCount: number;
  amount: number;
}

export interface RecentHire {
  id: string;
  workerId: string;
  workerName: string;
  avatarUrl: string | null;
  jobType: string;
  location: string;
  /** ISO completion date. */
  date: string;
  rate: number;
  /** 1–5, or null if not yet reviewed. */
  rating: number | null;
  reviewed: boolean;
}

export interface EmployerDashboard {
  stats: {
    activeJobs: number;
    pendingResponses: number;
    totalHires: number;
    /** KSh spent this calendar month. */
    totalSpent: number;
    /** Jobs created in the last 7 days. */
    weekTrend: number;
  };
  activeJobs: ActiveJob[];
  suggestedWorkers: SuggestedWorker[];
  spending: { items: SpendItem[]; total: number };
  recentHires: RecentHire[];
}
