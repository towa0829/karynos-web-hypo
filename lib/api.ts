const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuestionOption {
  option_id: string;
  option_text: string;
}

export interface Question {
  question_id: string;
  question_text: string;
  category: string;
  options: QuestionOption[];
}

export interface Recommendation {
  job_id: number;
  history_id: string;
  name: string;
  salary: number;
  age: number;
  imgs: string[];
  description: string;
  similarity_score: number;
}

export interface JobSummary {
  job_id: number;
  name: string;
  salary: number;
  age: number;
  imgs: string[];
  description: string;
  similarity_score: number;
}

export interface ResultResponse {
  personality_text: string;
  liked_jobs: JobSummary[];
  top_matches: JobSummary[];
}

// ── API functions ──────────────────────────────────────────────────────────────

export function createDreamer(name_family: string, name_given: string) {
  return request<{ dreamer_id: string }>("/api/v1/dreamers", {
    method: "POST",
    body: JSON.stringify({ name_family, name_given }),
  });
}

export function getQuestions() {
  return request<{ questions: Question[] }>("/api/v1/questions");
}

export function analyzeAnswers(
  dreamer_id: string,
  answers: { question_id: string; option_id: string }[]
) {
  return request<{ status: string; matched: number }>("/api/v1/recommend/analyze", {
    method: "POST",
    body: JSON.stringify({ dreamer_id, answers }),
  });
}

export function getRecommendation(dreamer_id: string) {
  return request<{ recommendation: Recommendation }>(
    `/api/v1/recommend/${dreamer_id}`
  );
}

export function getResult(dreamer_id: string) {
  return request<ResultResponse>(`/api/v1/recommend/${dreamer_id}/result`);
}

export function sendGood(dreamer_id: string, history_id: string) {
  return request<{ status: string }>(
    `/api/v1/recommend/${dreamer_id}/good?history_id=${history_id}`,
    { method: "POST" }
  );
}

export function sendBad(dreamer_id: string, history_id: string) {
  return request<{ status: string }>(
    `/api/v1/recommend/${dreamer_id}/bad?history_id=${history_id}`,
    { method: "POST" }
  );
}
