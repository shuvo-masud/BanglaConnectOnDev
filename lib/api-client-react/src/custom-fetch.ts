let baseUrl = "http://localhost:3000";
let authTokenGetter: (() => Promise<string | null>) | null = null;

/* ---------------- CONFIG ---------------- */

export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, "");
}

export function setAuthTokenGetter(
  getter: (() => Promise<string | null>) | null
) {
  authTokenGetter = getter;
}

/* ---------------- CORE FETCH ---------------- */

export async function customFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${baseUrl}${path}`;

  const token = authTokenGetter ? await authTokenGetter() : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");

  // Handle empty responses (204 No Content)
  if (res.status === 204) return null as T;

  // Parse JSON safely
  if (contentType?.includes("application/json")) {
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw data || new Error("Request failed");
    }

    return data as T;
  }

  // Fallback to text
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Request failed");
  }

  return text as unknown as T;
}