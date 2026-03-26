export interface ExperienceItem {
  company: string;
  position: string;
  startDate: string; // MM/YYYY
  endDate: string;   // MM/YYYY | "Present"
}

export interface EducationItem {
  institution: string;
  degree: string | null;
  major: string | null;
  startDate: string; // MM/YYYY
  endDate: string;   // MM/YYYY | "Present"
}

export interface Skills {
  technical: string[];
  soft: string[];
}

export interface CvParsedContent {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  skills: Skills;
  experience: ExperienceItem[];
  education: EducationItem[];
}