import type { ContractType, Modality } from "./constants";

export type Role = "candidate" | "employer" | "lawyer" | "business" | "admin";

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

export type SwipeChoice = "like" | "pass";
export type SwipeResult = { ok: true; matched: boolean; contactId?: string; peerName?: string } | { ok: false; error: string };

export type CombinaJob = {
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
  employer_name: string;
  employer_sector: string;
  employer_city: string;
  employer_state: string;
  reasons: string[];
};

export type CombinaProfile = {
  id: string;
  public_code: string;
  headline: string | null;
  years_experience: number | null;
  region: string;
  areas: string[];
  skills: string[];
  shifts: string[];
  modalities: Modality[];
  contract_types: ContractType[];
  available_from: string | null;
  education: string | null;
  courses: string | null;
  has_resume: boolean;
  checks: { label: string; ok: boolean }[];
  experiences: { role_title: string; employer: string | null; start_year: number | null; end_year: number | null; description: string | null }[];
};

export type Connection = {
  contact_id: string;
  peer_name: string;
  job_title: string | null;
  last_message: string | null;
  last_at: string;
  unread: number;
};

export type LawyerPublic = {
  id: string;
  full_name: string;
  oab_state: string;
  oab_number: string;
  areas: string[];
  city: string;
  state: string;
  online: boolean;
  contact_kind: "whatsapp" | "email";
  contact_value: string;
  bio: string | null;
};

export type BusinessPublic = {
  id: string;
  display_name: string;
  category: string;
  city: string;
  state: string;
  neighborhood: string | null;
  address: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  hours: string | null;
  story: string;
};

export type ReportPublic = {
  id: string;
  story: string;
  topic: string;
  city: string | null;
  state: string | null;
  month: string | null;
};

export type EmployerPublic = {
  id: string;
  display_name: string;
  sector: string;
  city: string;
  state: string;
};
