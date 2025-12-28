import { redirectIfSignedIn } from "@/app/features/lib/auth-redirect";
import { SignUpForm } from "@/app/features/auth/sign-up-form";

export default function Page() {
  redirectIfSignedIn("/dashboard");
  return <SignUpForm />;
}
