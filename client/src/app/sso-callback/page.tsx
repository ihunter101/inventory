//app/sso-callback/page.tsx
"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function Page() {
  return <AuthenticateWithRedirectCallback />;
}
