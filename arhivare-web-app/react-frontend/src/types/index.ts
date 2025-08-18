// src/types/index.ts
export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Fond {
  id: number;
  company_name: string;
  holder_name: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  source_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FondFormData {
  company_name: string;
  holder_name: string;
  address: string;
  email: string;
  phone: string;
  notes: string;
  source_url: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SearchResponse {
  results: Fond[];
  total: number;
  query: string;
}
