"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type OAuthStrategy = "oauth_google" | "oauth_microsoft" | "oauth_facebook" | "oauth_apple";


const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type Values = z.infer<typeof schema>;

export function SignInForm() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const isPending = form.formState.isSubmitting;

  const onSubmit = async (values: Values) => {
    if (!isLoaded || !signIn) return;

    try {
      const res = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId! });
        router.push("/dashboard");
      } else {
        form.setError("root", { message: "Sign in incomplete. Please try again." });
      }
    } catch (e: any) {
      form.setError("root", { message: e?.errors?.[0]?.message ?? "Sign in failed" });
    }
  };

  
  const sso = async (strategy: OAuthStrategy) => {
    if (!isLoaded) return;
    await signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* OAuth */}
        <div className="grid gap-3">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => sso("oauth_google")}>
            <Image src="/logos/google.svg" alt="Google" width={18} height={18} />
            Continue with Google
          </Button>

          <Button type="button" variant="outline" disabled={isPending} onClick={() => sso("oauth_microsoft")}>
            Continue with Microsoft
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or use email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email/password */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root?.message && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don’t have an account?{" "}
              <Link href="/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

