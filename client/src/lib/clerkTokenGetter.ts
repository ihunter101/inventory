let _getToken: (() => Promise<string | null>) | null = null;
let _isReady = false;

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
  _isReady = true;
}

export function isClerkTokenReady(): boolean {
  return _isReady;
}

export async function getClerkToken(): Promise<string | null> {
  return _getToken ? _getToken() : null;
}