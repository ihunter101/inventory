export {};

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: (options?: any) => Promise<string | null>;
      };
    };
  }
}
