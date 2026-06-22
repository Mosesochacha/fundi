export interface BrowseWorker {
  id: string;
  username: string;
  name: string;
  initials: string;
  trade: string;
  location: string;
  bio: string;
  avatarUrl: string | null;
  yearsExperience: number;
  currency: string;
  dailyRate: number;
  isAvailable: boolean;
  isVerified: boolean;
  certified: boolean;
  rating: number;
  reviewCount: number;
  jobsDone: number;
}

export interface BrowseWorkersResponse {
  workers: BrowseWorker[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BrowseFilters {
  selectedTrades: string[];
  location: string;
  minRate: number;
  maxRate: number;
  minRating: number;
  minExp: number;
  availableNow: boolean;
  verifiedOnly: boolean;
  certified: boolean;
  sortBy: string;
  page?: number;
  limit?: number;
}
