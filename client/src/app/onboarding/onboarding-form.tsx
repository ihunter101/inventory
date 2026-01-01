// app/onboarding/onboarding-form.tsx
// ============================================
// NUCLEAR OPTION: Poll until metadata is synced
// ============================================

// CLIENT: onboarding-form.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useAuth, useUser } from "@clerk/nextjs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";  
import { Building2, MapPin, ShieldCheck, UserRound } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().min(2, "Please select a location"),
})

type Values = z.infer<typeof schema>;

export default function OnboardingForm({
  initialName,
  initialLocation
}: { initialName: string, initialLocation: string }) {
  
  const router = useRouter();
  const { getToken, sessionId } = useAuth();
  const { user } = useUser();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: initialName || "",
      location: initialLocation || "Tapion",
    },
  });

  // Helper: Wait for Clerk metadata to update
  const waitForMetadataSync = async (maxAttempts = 10): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`🔄 Checking metadata sync (attempt ${i + 1}/${maxAttempts})...`);
      
      // Reload user to get fresh data
      if (user) {
        await user.reload();
      }
      
      // Get fresh token
      await getToken({ skipCache: true });
      
      // Check if metadata is synced
      const metadata = user?.publicMetadata as any;
      if (metadata?.onboardingComplete === true) {
        console.log("✅ Metadata synced!");
        return true;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    console.warn("⚠️ Metadata sync timed out, forcing redirect anyway");
    return false;
  };

  const submit = async (values: Values) => {
    if (!apiUrl) {
      form.setError("root", { message: "API URL is not configured" });
      return;
    }

    try {
      const token = await getToken();
      
      // 1. Update backend
      const res = await fetch(`${apiUrl}/me`, {
        method: "PATCH", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      console.log("✅ Backend updated successfully");

      // 2. Wait for Clerk to sync (polls until metadata appears)
      const synced = await waitForMetadataSync();
      
      if (synced) {
        console.log("✅ Navigating to dashboard...");
        // Use hard redirect to ensure fresh page load
        window.location.href = "/dashboard";
      } else {
        // Fallback: Force redirect anyway after timeout
        console.log("⚠️ Forcing redirect after timeout");
        window.location.href = "/dashboard";
      }

    } catch (error: any) {
      console.error("❌ Onboarding error:", error);
      form.setError("root", { 
        message: error.message || "Could not complete onboarding. Please try again." 
      });
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  const isPending = form.formState.isSubmitting;

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40 p-6">
      <div className="mx-auto w-full max-w-4xl grid gap-6 md:grid-cols-[1.1fr_.9fr]">
        <Card className="shadow-xl">
          <form onSubmit={form.handleSubmit(submit, onInvalid)}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Welcome 👋</CardTitle>
                <Badge variant="secondary" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  One-time setup
                </Badge>
              </div>
              <CardDescription>
                This runs once. You can update later in Settings.
              </CardDescription>
              <Progress value={isPending ? 90 : 70} />
            </CardHeader>

            <CardContent className="space-y-6">
              {form.formState.errors.root?.message && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  Display name
                </label>
                <Input 
                  placeholder="Hunter Gaillard" 
                  {...form.register("name")}
                  disabled={isPending}
                />
                {form.formState.errors.name?.message && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Primary branch
                </label>
                <Select
                  defaultValue={form.getValues("location")}
                  onValueChange={(v) => form.setValue("location", v, { shouldValidate: true })}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tapion">Tapion</SelectItem>
                    <SelectItem value="VieuxFort">Vieux Fort</SelectItem>
                    <SelectItem value="GrosIslet">Gros Islet</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.location?.message && (
                  <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
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