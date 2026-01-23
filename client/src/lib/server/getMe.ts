import "server-only";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getMeServer() {
  const session = await auth(); // ✅ await it

  // Some versions expose getToken, some don't.
  // If getToken exists, use it:
  const token = session.getToken ? await session.getToken() : null;

  if (!token) return null;

  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.user ?? null;
}
