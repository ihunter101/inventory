import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/uploadthing(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // 1. STATE: NOT SIGNED IN
  if (!userId) {
    if (!isPublicRoute(req)) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // 2. STATE: SIGNED IN
  const onboardingComplete = sessionClaims?.public_metadata?.onboardingComplete === true;

  if (userId && !onboardingComplete) {
    if (!isOnboardingRoute(req) && !isPublicRoute(req)) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // B) USER ALREADY ONBOARDED
  if (onboardingComplete) {
    if (isOnboardingRoute(req)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Standard Next.js matcher that ignores static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};