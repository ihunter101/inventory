// lib/clerkTokenGetter.ts
let _getToken: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

export async function getClerkToken(): Promise<string | null> {
  return _getToken ? _getToken() : null;
}