// Shared types for the worker profile CV page (see WorkerProfile.tsx).

export interface PortfolioPhoto {
  id: string;
  url: string;
  caption: string;
  jobType: string;
  isBefore?: boolean;
  afterPhotoId?: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  startYear: number;
  endYear: number | null; // null = current
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  yearIssued: number;
  expiryYear?: number;
  documentUrl?: string;
  isVerified: boolean;
}

export interface EducationItem {
  id: string;
  type: "school" | "training" | "course";
  name: string;
  institution: string;
  startYear: number;
  endYear: number;
}

export interface ReviewItem {
  id: string;
  author: string;
  initials: string;
  rating: number;
  text: string;
  jobType: string;
  date: string;
}

export interface RatingBucket {
  stars: number;
  count: number;
}

export interface WorkerProfileData {
  id: string;
  name: string;
  initials: string;
  trade: string;
  yearsExperience: number;
  location: string;
  currency: string;
  isVerified: boolean;
  isAvailable: boolean;
  phoneVerified: boolean;
  rating: number;
  reviewCount: number;
  jobsDone: number;
  dailyRate: number;
  about: string;
  services: string[];
  serviceAreas: string[];
  portfolio: PortfolioPhoto[];
  experience: ExperienceItem[];
  certifications: Certification[];
  education: EducationItem[];
  reviews: ReviewItem[];
  ratingBreakdown: RatingBucket[];
}
