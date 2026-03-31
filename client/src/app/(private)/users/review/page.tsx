"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useReviewUserAccessMutation } from "@/app/state/api";

export default function ReviewUserAccessPage() {
  const searchParams = useSearchParams();
  const [reviewUserAccess] = useReviewUserAccessMutation();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing request...");

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const id = searchParams.get("id");
    const token = searchParams.get("token");
    const action = searchParams.get("action") as "grant" | "deny" | null;

    if (!id || !token || !action) {
      setStatus("error");
      setMessage("Missing review parameters.");
      return;
    }

    const run = async () => {
      try {
        const res = await reviewUserAccess({ id, token, action }).unwrap();
        setStatus("success");
        setMessage(res.message || `Access ${action}ed successfully.`);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.data?.error || "Failed to process access review.");
      }
    };

    run();
  }, [searchParams, reviewUserAccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg">
        <h1 className="text-xl font-semibold mb-3">User Access Review</h1>

        <p
          className={`text-sm ${
            status === "error"
              ? "text-red-600"
              : status === "success"
              ? "text-green-600"
              : "text-slate-600"
          }`}
        >
          {message}
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/users"
            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Go to Users
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}