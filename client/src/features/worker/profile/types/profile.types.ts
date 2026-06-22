export interface PortfolioItem {
  id: string;
  url: string;
  caption: string;
  jobType?: string;
  isBefore?: boolean;
  afterPhotoId?: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  startYear: number;
  endYear: number | null;
  description: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuingBody: string;
  yearIssued: number;
  expiryYear?: number;
  documentUrl?: string;
  isVerified: boolean;
}

export type EducationType = "school" | "training" | "course";

export interface EducationItem {
  id: string;
  type: EducationType;
  name: string;
  institution: string;
  startYear: number;
  endYear: number;
}

export interface RatingBreakdownRow {
  stars: number;
  count: number;
}

export interface WorkerProfile {
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
  ratingBreakdown: RatingBreakdownRow[];
  reviews: unknown[];
  dailyRate: number;
  about: string;
  services: string[];
  serviceAreas: string[];
  portfolio: PortfolioItem[];
  experience: ExperienceItem[];
  certifications: CertificationItem[];
  education: EducationItem[];
}
