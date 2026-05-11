import "server-only";

export type CaseSummary = {
  slug: string;
  title: string;
  summary: string;
  client_name: string | null;
  conducted_at: string | null;
  thumbnail_url: string | null;
};

export type CaseDetail = CaseSummary & {
  description: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchCases(): Promise<CaseSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cases`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch cases: ${res.status}`);
  }
  return res.json();
}

export async function fetchCase(slug: string): Promise<CaseDetail | null> {
  const safe = encodeURIComponent(decodeURIComponent(slug));
  const res = await fetch(`${API_BASE_URL}/api/v1/cases/${safe}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch case ${slug}: ${res.status}`);
  }
  return res.json();
}
