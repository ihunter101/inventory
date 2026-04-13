"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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

import {
  useGetMeQuery,
  useNotifyPendingAccessMutation,
} from "@/app/state/api";
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
  const hasTriggeredNotify = useRef(false);

  const [notifyPendingAccess] = useNotifyPendingAccessMutation();

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
  const isAwaitingRoleAssignment = isGranted && (!role || role === "viewer");
  const shouldStayOnPendingPage = !isGranted || isAwaitingRoleAssignment;

  useEffect(() => {
    if (!user) return;

    // Only redirect when user is truly fully ready
    if (status !== "granted") return;
    if (!role || role === "viewer") return;

    if (role === "admin" || role === "inventoryClerk") {
      router.replace("/dashboard");
    } else {
      router.replace("/products");
    }
  }, [user, status, role, router]);

  useEffect(() => {
    if (!user) return;
    if (!shouldStayOnPendingPage) return;
    if (hasTriggeredNotify.current) return;

    const notificationKey = `pending-access-notified-${user.id}`;
    const alreadyNotified =
      typeof window !== "undefined" &&
      sessionStorage.getItem(notificationKey) === "true";

    if (alreadyNotified) {
      hasTriggeredNotify.current = true;
      return;
    }

    hasTriggeredNotify.current = true;

    const run = async () => {
      try {
        await notifyPendingAccess().unwrap();

        if (typeof window !== "undefined") {
          sessionStorage.setItem(notificationKey, "true");
        }
      } catch (error) {
        console.error("Failed to notify admins about pending access:", error);
        // allow retry on a future mount/refresh if request failed
        hasTriggeredNotify.current = false;
      }
    };

    run();
  }, [user, shouldStayOnPendingPage, notifyPendingAccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl border-border bg-card text-card-foreground shadow-lg">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Loading your access status
              </p>
              <p className="text-sm text-muted-foreground">
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl border-border bg-card text-card-foreground shadow-lg">
          <CardHeader>
            <CardTitle>Unable to load page</CardTitle>
            <CardDescription>
              We could not load your access status right now.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = isGranted
    ? isAwaitingRoleAssignment
      ? `Approval complete for ${name}`
      : `Access approved for ${name}`
    : isDenied
      ? `Access update for ${name}`
      : "Access request submitted";

  const description = isGranted
    ? isAwaitingRoleAssignment
      ? "Your request was approved. An administrator is now assigning your role."
      : "Your onboarding has been reviewed and access has been granted."
    : isDenied
      ? "Your onboarding has been reviewed. Access was not approved at this time."
      : "Your onboarding details were submitted successfully and are now awaiting review.";

  const badgeText = isGranted
    ? isAwaitingRoleAssignment
      ? "Approved - role pending"
      : "Approved"
    : isDenied
      ? "Not approved"
      : "Pending review";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden bg-slate-950 p-8 text-white sm:p-10 dark:bg-slate-900">
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
                      ? isAwaitingRoleAssignment
                        ? "Approval complete, final setup in progress"
                        : "Account access confirmed"
                      : isDenied
                        ? "Account review completed"
                        : "Your request is under review"}
                  </h1>

                  <p className="max-w-lg text-sm leading-6 text-slate-300 sm:text-base dark:text-slate-300">
                    {isGranted
                      ? isAwaitingRoleAssignment
                        ? "Your account has been approved. The final step is assigning your system role before you can enter the platform."
                        : "Your account has been approved and is ready for use."
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
                      ? isAwaitingRoleAssignment
                        ? "Approved, waiting for role assignment"
                        : "Completed successfully"
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

          <div className="bg-card p-6 sm:p-8 lg:p-10">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pt-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  {isGranted ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : isDenied ? (
                    <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <Clock3 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </CardTitle>
                <CardDescription className="pt-1 text-sm leading-6 text-muted-foreground">
                  {description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-0">
                <div className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
                  <div className="mb-2 text-sm font-medium text-foreground">
                    Confirmation notice
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {isPending ? (
                      <>
                        Once your request has been reviewed, a confirmation will
                        also be sent to{" "}
                        <span className="font-medium text-foreground">
                          {email || "your email address"}
                        </span>
                        .
                      </>
                    ) : isAwaitingRoleAssignment ? (
                      <>
                        Your request has been approved. A final confirmation will
                        be sent to{" "}
                        <span className="font-medium text-foreground">
                          {email || "your email address"}
                        </span>{" "}
                        after your role has been assigned.
                      </>
                    ) : (
                      <>
                        A confirmation has been sent to{" "}
                        <span className="font-medium text-foreground">
                          {email || "your email address"}
                        </span>
                        .
                      </>
                    )}
                  </p>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    What happens next
                  </h2>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="mb-1 text-sm font-medium text-foreground">
                        <span className="text-lg font-bold">1. Review</span>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {isPending
                          ? "Your request is checked by an authorized member of the team."
                          : "Your request has already been reviewed."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="mb-1 text-sm font-medium text-foreground">
                        <span className="text-lg font-bold">2. Confirmation</span>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {isAwaitingRoleAssignment
                          ? "An administrator is assigning your role before full access is unlocked."
                          : "You will receive an email update confirming the final decision. "}
                        <span className="font-semibold text-foreground">
                          Please check your trash, spam, or junk mail.
                        </span>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="mb-1 text-sm font-medium text-foreground">
                        <span className="text-lg font-bold">3. Access</span>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {isGranted
                          ? isAwaitingRoleAssignment
                            ? "You have been approved, but final system access will begin after role assignment."
                            : "You are being redirected now."
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