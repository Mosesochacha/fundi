// Types + mock seed for the worker profile CV page.
// NOTE: the GET/PATCH/POST endpoints in the spec (/api/worker/...) do not exist
// on the backend yet. The page is seeded from MOCK_PROFILE so the UI is fully
// reviewable; inline edits persist best-effort (see WorkerProfile.tsx).

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

export const MOCK_PROFILE: WorkerProfileData = {
  id: "w_demo",
  name: "James Mwangi",
  initials: "JM",
  trade: "Electrician",
  yearsExperience: 9,
  location: "Westlands, Nairobi",
  currency: "KSh",
  isVerified: true,
  isAvailable: true,
  phoneVerified: true,
  rating: 4.9,
  reviewCount: 47,
  jobsDone: 132,
  dailyRate: 2500,
  about:
    "Licensed electrician with 9 years of experience across residential and commercial wiring, solar installation, and fault finding. I take pride in clean, code-compliant work and clear communication from quote to completion.",
  services: [
    "House wiring",
    "Solar installation",
    "Fault finding",
    "Switchboard upgrades",
    "Security lighting",
    "Inspection & certification",
  ],
  serviceAreas: ["Westlands", "Kilimani", "Lavington", "Parklands", "CBD"],
  portfolio: [
    { id: "p1", url: "", caption: "3-bedroom rewire", jobType: "Residential" },
    { id: "p2", url: "", caption: "Rooftop solar array", jobType: "Solar" },
    { id: "p3", url: "", caption: "Office switchboard", jobType: "Commercial" },
    {
      id: "pb1",
      url: "",
      caption: "Panel cleanup - before",
      jobType: "Repair",
      isBefore: true,
      afterPhotoId: "pa1",
    },
    { id: "pa1", url: "", caption: "Panel cleanup - after", jobType: "Repair" },
  ],
  experience: [
    {
      id: "e1",
      title: "Senior Electrician",
      company: "BrightVolt Contractors",
      startYear: 2019,
      endYear: null,
      description:
        "Lead electrician on residential and small-commercial projects; mentor two junior electricians.",
    },
    {
      id: "e2",
      title: "Electrician",
      company: "PowerLine Services",
      startYear: 2015,
      endYear: 2019,
      description:
        "Installation and maintenance of domestic wiring, lighting, and backup systems.",
    },
  ],
  certifications: [
    {
      id: "c1",
      name: "Licensed Electrician (Class B)",
      issuingBody: "EPRA",
      yearIssued: 2016,
      isVerified: true,
    },
    {
      id: "c2",
      name: "Solar PV Installer",
      issuingBody: "Strathmore Energy Centre",
      yearIssued: 2020,
      expiryYear: 2026,
      isVerified: false,
    },
  ],
  education: [
    {
      id: "ed1",
      type: "school",
      name: "Diploma in Electrical Engineering",
      institution: "Kenya Polytechnic",
      startYear: 2012,
      endYear: 2015,
    },
    {
      id: "ed2",
      type: "training",
      name: "Advanced Wiring & Safety",
      institution: "NITA",
      startYear: 2017,
      endYear: 2017,
    },
  ],
  reviews: [
    {
      id: "r1",
      author: "Aisha N.",
      initials: "AN",
      rating: 5,
      text: "Arrived on time, diagnosed the fault quickly and fixed it cleanly. Highly recommend.",
      jobType: "Fault finding",
      date: "2 weeks ago",
    },
    {
      id: "r2",
      author: "Peter O.",
      initials: "PO",
      rating: 5,
      text: "Did a full rewire of our flat. Professional and tidy throughout.",
      jobType: "House wiring",
      date: "1 month ago",
    },
    {
      id: "r3",
      author: "Grace W.",
      initials: "GW",
      rating: 4,
      text: "Good work on the solar setup. Slight delay but kept me informed.",
      jobType: "Solar",
      date: "2 months ago",
    },
  ],
  ratingBreakdown: [
    { stars: 5, count: 39 },
    { stars: 4, count: 6 },
    { stars: 3, count: 1 },
    { stars: 2, count: 1 },
    { stars: 1, count: 0 },
  ],
};
