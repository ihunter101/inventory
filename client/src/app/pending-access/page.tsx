"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { useGetMeQuery } from "@/app/state/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PendingAccessPage() {
  const router = useRouter();

  const { data, isLoading, isError } = useGetMeQuery(undefined, {
    pollingInterval: 50000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const user = data?.user;
  const name = user?.name || "User";
  const email = user?.email || "";
  const status = user?.accessStatus || "pending";
  const role = user?.role;

  const isGranted = status === "granted";
  const isDenied = status === "denied";
  const isPending = status === "pending";

  useEffect(() => {
    if (!user) return;
    if (!isGranted) return;

    if (role === "admin" || role === "inventoryClerk") {
      router.replace("/dashboard");
    } else {
      router.replace("/products");
    }
  }, [user, isGranted, role, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-lg">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-900">
                Loading your access status
              </p>
              <p className="text-sm text-slate-500">
                Please wait a moment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Unable to load page</CardTitle>
            <CardDescription>
              We could not load your access status right now.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            {/* <Button asChild>
              <Link href="/sign-in">Go to sign in</Link>
            </Button> */}
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = isGranted
    ? `Access approved for ${name}`
    : isDenied
    ? `Access update for ${name}`
    : "Access request submitted";

  const description = isGranted
    ? "Your onboarding has been reviewed and access has been granted."
    : isDenied
    ? "Your onboarding has been reviewed. Access was not approved at this time."
    : "Your onboarding details were submitted successfully and are now awaiting review.";

  const badgeText = isGranted
    ? "Approved"
    : isDenied
    ? "Not approved"
    : "Pending review";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden bg-slate-950 p-8 text-white sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.18),transparent_35%)]" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <ShieldCheck className="h-7 w-7" />
                </div>

                <div className="space-y-3">
                  <Badge className="rounded-full border-0 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                    {badgeText}
                  </Badge>

                  <h1 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
                    {isGranted
                      ? "Account access confirmed"
                      : isDenied
                      ? "Account review completed"
                      : "Your request is under review"}
                  </h1>

                  <p className="max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                    {isGranted
                      ? "Your account has been approved and is ready for use."
                      : isDenied
                      ? "Your request was reviewed, but access was not granted at this time."
                      : "An authorized team member will review your onboarding request. This page checks for updates automatically."}
                  </p>
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Clock3 className="h-4 w-4" />
                    Review status
                  </div>
                  <p className="text-sm text-slate-300">
                    {isGranted
                      ? "Completed successfully"
                      : isDenied
                      ? "Completed"
                      : "Waiting for authorized review"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Mail className="h-4 w-4" />
                    Email confirmation
                  </div>
                  <p className="break-all text-sm text-slate-300">
                    {email || "Your account email"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  {isGranted ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : isDenied ? (
                    <XCircle className="h-6 w-6 text-rose-600" />
                  ) : (
                    <Clock3 className="h-6 w-6 text-slate-700" />
                  )}
                </div>

                <CardTitle className="text-2xl font-semibold tracking-tight">
                  {title}
                </CardTitle>
                <CardDescription className="pt-1 text-sm leading-6 text-slate-600">
                  {description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-0">
                <div className="rounded-2xl border bg-slate-50 p-4 sm:p-5">
                  <div className="mb-2 text-sm font-medium text-slate-900">
                    Confirmation notice
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {isPending ? (
                      <>
                        Once your request has been reviewed, a confirmation will
                        also be sent to{" "}
                        <span className="font-medium text-slate-900">
                          {email || "your email address"}
                        </span>
                        .
                      </>
                    ) : (
                      <>
                        A confirmation will also be sent to{" "}
                        <span className="font-medium text-slate-900">
                          {email || "your email address"}
                        </span>
                        .
                      </>
                    )}
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    What happens next
                  </h2>

                  <div className="space-y-3">
                    <div className="rounded-2xl border p-4">
                      <div className="mb-1 text-sm font-medium text-slate-900">
                        <span className="text-lg font-bold">1. Review</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        Your request is checked by an authorized member of the
                        team.
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <div className="mb-1 text-sm font-medium text-slate-900">
                        <span className="font-bold text-lg">2. Confirmation</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        You will receive an email update confirming the final
                        decision.
                        <span className="font-semibold">Please check your trash, span or junk mail.</span>
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <div className="mb-1 text-sm font-medium text-slate-900">
                         <span className="font-bold text-lg">3. Access</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        {isGranted
                          ? "You are being redirected now."
                          : isDenied
                          ? "If needed, you can contact an administrator for further assistance."
                          : "This page will update automatically once your access status changes."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button asChild className="h-11 rounded-xl px-5">
                    <Link href="/sign-in">
                      Go to sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-11 rounded-xl px-5">
                    <Link href="/">Back to home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}