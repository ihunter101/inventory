import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function redirectIfSignedIn(to = "/dashboard") {
  const { userId } = await auth(); // ✅ await auth()
  if (userId) redirect(to);
}
