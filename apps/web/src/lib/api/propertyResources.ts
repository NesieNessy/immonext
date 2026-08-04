import { authFetch } from './authFetch';

export async function propertyResourceRequest<T>(
  resource: string,
  init: RequestInit = {},
  query: Record<string, string | number | boolean | null | undefined> = {},
): Promise<T | null> {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined) search.set(key, String(value));
  });
  const response = await authFetch(`/api/property-resources/${resource}${search.size ? `?${search}` : ''}`, init);
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
