import { redirectIfSignedIn } from "@/app/features/lib/auth-redirect";
import { SignInForm } from "@/app/features/auth/sign-in-form";

export default async function Page() {
  await redirectIfSignedIn("/dashboard"); // ✅ await
  return <SignInForm />;
}
