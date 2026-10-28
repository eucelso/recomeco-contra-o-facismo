import type { ContractType, Modality } from "./constants";

export type Role = "candidate" | "employer" | "admin";

export type JobListing = {
  id: string;
  title: string;
  description: string;
  area: string;
  city: string | null;
  state: string | null;
  modality: Modality;
  contract_type: ContractType;
  salary_min: number | null;
  salary_max: number | null;
  benefits: string | null;
  published_at: string;
  employer_id: string;
  employer_name: string;
  employer_sector: string;
};

export type CandidateSearchRow = {
  id: string;
  public_code: string;
  display_name: string | null;
  headline: string | null;
  years_experience: number | null;
  areas: string[];
  skills: string[];
  region: string;
  modalities: Modality[];
  contract_types: ContractType[];
};

export type CandidateCard = Omit<CandidateSearchRow, "region"> & {
  region: string;
  revealed: boolean;
  shifts: string[];
  available_from: string | null;
  education: string | null;
  courses: string | null;
  has_resume: boolean;
  resume_path: string | null;
  invites_paused: boolean;
  contact_status: "pending" | "accepted" | "declined" | "revoked" | null;
  contact_id: string | null;
  experiences: {
    role_title: string;
    employer: string | null;
    start_year: number | null;
    end_year: number | null;
    description: string | null;
  }[];
};

export type Message = {
  id: string;
  contact_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
