import { SignUp } from "@clerk/nextjs";
import { SignUpForm } from "@/app/features/auth/sign-up-form"; // if you have one

export default function Page({ params }: { params: { "sign-up"?: string[] } }) {
  const slug = params["sign-up"]?.[0];
  if (slug) return <SignUp routing="path" path="/sign-up" />;

  return <SignUpForm />; // or <SignUp /> if you don't have a custom form
}
