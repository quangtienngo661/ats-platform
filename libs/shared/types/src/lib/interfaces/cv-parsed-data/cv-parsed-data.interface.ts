// ── Exact shape returned by AI CV_PARSING_PROMPT ──────────────────────────────
export interface ICvParsedData {
  summary: string | null;
  location: string | null;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  experience: {
    company: string | null;
    position: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  }[];
  projects: {
    name: string | null;
    role: string | null;
    technologies: string[];
    description: string | null;
    start_date: string | null;
    end_date: string | null;
  }[];
  education: {
    institution: string | null;          // ← "institution", not "school"
    degree: 'Certificate' | 'Bachelor' | 'Master' | 'PhD' | 'Diploma' | null;
    major: string | null;                // ← added major
  }[];
  certificates: string[];
  // stored in DB after confirmation
  isConfirmed?: boolean;
}
