export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data && typeof data.error === 'string' && data.error) || `Request failed with status ${res.status}`)
  }
  return data as T
}
