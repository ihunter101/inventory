import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // 1. STATE: NOT SIGNED IN
  if (!userId) {
    // If trying to access protected content (not public) -> Go to sign-in
    if (!isPublicRoute(req)) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
    // Allow access to public routes (like "/") for guests
    return NextResponse.next();
  }

  // 2. STATE: SIGNED IN
  // Extract onboarding status from your updated session token

  const onboardingComplete = sessionClaims?.public_metadata?.onboardingComplete === true;

if (userId && !onboardingComplete) {
  // ONLY redirect if they aren't already on the onboarding page
  if (!isOnboardingRoute(req) && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
}

  // A) USER NOT ONBOARDED
  // if (!onboardingComplete) {
  //   // Force them to onboarding if they aren't there already and aren't on a public route
  //   if (!isOnboardingRoute(req) && !isPublicRoute(req)) {
  //     return NextResponse.redirect(new URL("/onboarding", req.url));
  //   }
  // }

  // B) USER ALREADY ONBOARDED
  if (onboardingComplete) {
    // Prevent them from seeing the onboarding page again
    if (isOnboardingRoute(req)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Prevent them from seeing sign-in/sign-up pages
    if (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};