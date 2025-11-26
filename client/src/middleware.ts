// middleware.ts  (place at the project root, next to package.json)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Protect everything inside app/(private)/**
const isPrivate = createRouteMatcher(['/(private)(.*)']); // his protect all routes in the folder as oppose to individually targetting them

export default clerkMiddleware(async (auth, req) => {
  if (isPrivate(req)) {
    await auth.protect(); // unauthenticated → redirected to /sign-in
  }
}, {
  // make sure Clerk always uses your custom pages, not the hosted ones
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
});

export const config = {
  matcher: [
    // run for all routes except Next internals and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
