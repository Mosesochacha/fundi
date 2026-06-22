export type RequestStatus = "new" | "today" | "active" | "completed";

export interface JobRequest {
  id: string;
  clientName: string;
  jobType: string;
  location: string;
  status: RequestStatus;
  /** ISO date string for the requested job. */
  date: string;
  description: string;
}

export interface UpcomingJob {
  id: string;
  title: string;
  clientName: string;
  location: string;
  /** ISO date string the job is scheduled for. */
  date: string;
  /** Human label, e.g. "9:00 AM". */
  time: string;
}

export interface Review {
  id: string;
  authorName: string;
  /** 1–5. */
  rating: number;
  text: string;
  /** ISO date string. */
  date: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
  /** Where the "Add" shortcut should send the worker (todo items only). */
  href?: string;
}

export interface WorkerDashboard {
  stats: {
    newRequests: number;
    totalJobs: number;
    rating: number;
    reviewCount: number;
    profileViews: number;
    weeklyViews: number;
  };
  recentRequests: JobRequest[];
  upcomingJobs: UpcomingJob[];
  recentReviews: Review[];
  profileStrength: {
    percentage: number;
    completedItems: ChecklistItem[];
    todoItems: ChecklistItem[];
  };
}
