import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { userId, getToken } = await auth();

  console.log("step !")
  if (!userId) redirect("/sign-in");

  console.log("step 2")

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");

  const res = await fetch(`${apiUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  console.log("token:", token);

  if (!res.ok) redirect("/sign-in");

  const me = await res.json();

  // ✅ gate onboarding once (server-side)
  if (!me?.onboardedAt) redirect("/onboarding");

  return <DashboardClient />;
}
