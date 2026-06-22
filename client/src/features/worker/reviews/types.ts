export interface WorkerReview {
  id: string;
  authorName: string;
  /** 1–5. */
  rating: number;
  text: string;
  /** The job this review was left for. */
  jobTitle: string;
  /** ISO date string. */
  date: string;
}

export interface ReviewBreakdownRow {
  stars: number;
  count: number;
}

export interface WorkerReviews {
  summary: {
    rating: number;
    reviewCount: number;
    breakdown: ReviewBreakdownRow[];
  };
  reviews: WorkerReview[];
}
