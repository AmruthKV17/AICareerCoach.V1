const rawBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").trim();
const normalizedBase = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

export const RESUME_OPTIMIZE_ENDPOINT = `${normalizedBase}/resume-optimize`;
