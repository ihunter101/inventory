import { SignIn } from "@clerk/nextjs";

export default function Page() {
  // This route is ONLY for Clerk's internal step
  return <SignIn routing="path" path="/sign-in" />;
}
