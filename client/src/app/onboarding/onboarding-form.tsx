"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, ShieldCheck, UserRound } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  location: z.string().min(2, "Please select a location"),
});

type Values = z.infer<typeof schema>;

export default function OnboardingForm({
  initialLocation,
  initialName,
}: {
  initialName: string;
  initialLocation: string;
}) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const hasClerkName = fullName.length > 0;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: initialName || "",
      location: initialLocation || "Tapion",
    },
  });

  const waitForMetadataSync = async (maxAttempts = 10): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (user) await user.reload();
      await getToken({ skipCache: true });
      const metadata = user?.publicMetadata as any;
      if (metadata?.onboardingComplete === true) return true;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    return false;
  };

  const submit = async (values: Values) => {
    console.log("🚀 Submitting:", values);

    if (!apiUrl) {
      form.setError("root", { message: "API URL is not configured" });
      return;
    }

    try {
      const token = await getToken();

      const res = await fetch(`${apiUrl}/me/onboard`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: values.location,
          ...(!hasClerkName && { name: values.name }),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      await waitForMetadataSync();
      window.location.href = "/dashboard";
    } catch (error: any) {
      form.setError("root", {
        message: error.message || "Could not complete onboarding. Please try again.",
      });
    }
  };

  const isPending = form.formState.isSubmitting;

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40 p-6">
      <div className="mx-auto w-full max-w-4xl grid gap-6 md:grid-cols-[1.1fr_.9fr]">
        <Card className="shadow-xl">
          <form onSubmit={form.handleSubmit(submit, (errors) => console.log("❌ Validation errors:", errors))}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {hasClerkName ? `Welcome, ${fullName} 👋` : "Welcome 👋"}
                </CardTitle>
                <Badge variant="secondary" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  One-time setup
                </Badge>
              </div>
              <CardDescription>
                Just one thing — select your primary branch to get started.
              </CardDescription>
              <Progress value={isPending ? 90 : 70} />
            </CardHeader>

            <CardContent className="space-y-6">
              {form.formState.errors.root?.message && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              {hasClerkName ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    Your name
                  </label>
                  <div className="flex h-9 w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    {fullName}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pulled from your account. Update in profile settings.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    Your name
                  </label>
                  <Input
                    placeholder="James Smith"
                    {...form.register("name")}
                    disabled={isPending}
                  />
                  {form.formState.errors.name?.message && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Primary branch
                </label>
                <Controller
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tapion">Tapion</SelectItem>
                        <SelectItem value="vieuxFort">Vieux Fort</SelectItem>
                        <SelectItem value="soufriere">Soufriere</SelectItem>
                        <SelectItem value="rodneyBay">Rodney Bay</SelectItem>
                        <SelectItem value="blueCoral">Blue Coral</SelectItem>
                        <SelectItem value="manoelStreet">Manoel Street</SelectItem>
                        <SelectItem value="memberCare">Member Care</SelectItem>
                        <SelectItem value="sunnyAcres">Sunny Acres</SelectItem>
                        <SelectItem value="emCare">E-Care</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.location?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Syncing session..." : "Finish setup"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Why this matters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Location defaults</p>
              <p>Sets branch context for inventory and requests.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}