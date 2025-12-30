"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from "@clerk/nextjs";
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
  name: z.string().min(2, "Enter your name"),
  location: z.string().min(2, "Enter your location"),
})

type Values = z.infer<typeof schema>;

export default function OnboardingForm({
  initialName,
  initialLocation
}: { initialName: string, initialLocation: string }) {
  
  const router = useRouter();
  const { getToken } = useAuth(); // Now valid due to "use client"

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialName,
      location: initialLocation,
    },
  });


  const submit = async (values: Values) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/me`,{
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(values)
  });

  if (!res.ok) {
    form.setError("root", { message: "Could not complete onboarding. Please try again." });
  }
  router.replace("/dashboard"); // TODO: add condtional logic for non admins
  };

  const isPending = form.formState.isSubmitting;

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40 p-6">
      <div className="mx-auto w-full max-w-4xl grid gap-6 md:grid-cols-[1.1fr_.9fr]">
        <Card className="shadow-xl">
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
            <Progress value={70} />
          </CardHeader>

          <CardContent className="space-y-6">
            {form.formState.errors.root?.message && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4" />
                <span>Your profile</span>
              </div>

              <label className="text-sm font-medium">Display name</label>
              <Input placeholder="Hunter Gaillard" {...form.register("name")} />
              {form.formState.errors.name?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Default location</span>
              </div>

              <label className="text-sm font-medium">Primary branch</label>
              <Select
                value={form.watch("location")}
                onValueChange={(v) => form.setValue("location", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {/* Replace these with your actual Location enum values */}
                  <SelectItem value="Tapion">Tapion</SelectItem>
                  <SelectItem value="VieuxFort">Vieux Fort</SelectItem>
                  <SelectItem value="GrosIslet">Gros Islet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {form.formState.errors.location?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={form.handleSubmit(submit)} disabled={isPending}>
                {isPending ? "Finishing…" : "Finish setup"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Why this matters
            </CardTitle>
            <CardDescription>
              Used for defaults + access behavior across the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Location defaults</p>
              <p>Sets branch context for inventory, requests, and workflows.</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Permissions stay safe</p>
              <p>Roles stay controlled by admins; onboarding doesn’t elevate access.</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Runs once</p>
              <p>After completion, you’ll never see this page again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}