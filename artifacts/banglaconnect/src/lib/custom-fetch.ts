let baseUrl = "";
let getToken: (() => Promise<string | null>) | null = null;

/* ---------------- CONFIG ---------------- */
export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, "");
}

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn;
}

/* ---------------- CORE FETCH ---------------- */
export async function customFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = getToken ? await getToken() : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  if (res.status === 204) return null;

  return res.json();
}
