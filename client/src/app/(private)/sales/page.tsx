"use client";

import React, { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { SalesEntryForm } from "@/app/(components)/sales/SalesEntryForm";
import { SalesHistory } from "@/app/(components)/sales/SalesHistory";
import { useGetMeQuery, useGetTodaySaleQuery } from "@/app/state/api";
import { locationLabels } from "@/lib/locationLabels";

function money(n?: number | null) {
  const x = Number(n ?? 0);
  return `EC$${x.toFixed(2)}`;
}

export default function SalesPage() {
  const { user, isLoaded } = useUser();

  const { data: todaySaleData, isLoading: isLoadingToday } = useGetTodaySaleQuery();
  const { data } = useGetMeQuery();

  if (!isLoaded) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!user) redirect("/sign-in");

  const role =
    (user.publicMetadata?.role as string | undefined) ??
    data?.user?.role ??
    "—";

  const location =
    (user.publicMetadata?.location as string | undefined) ??
    data?.user?.location ??
    "—";

  const locationDisplay = locationLabels(location);

  const isPrivileged = role === "admin";
  const sale = todaySaleData?.sale ?? null;

  const [isEditing, setIsEditing] = useState(false);

  const showEntryForm = !sale || (isPrivileged && isEditing);

  const summary = useMemo(() => {
    if (!sale) return null;

    return {
      cashTotal: sale.cashTotal ?? 0,
      credit: sale.creditCardTotal ?? 0,
      debit: sale.debitCardTotal ?? 0,
      cheque: sale.chequeTotal ?? 0,
      grand: sale.grandTotal ?? 0,
      updatedAt: sale.updatedAt,
    };
  }, [sale]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Sales Management
              </h1>
              <p className="mt-1 text-muted-foreground">
                Record your daily sales for{" "}
                <span className="font-medium text-primary">{locationDisplay}</span> today
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Location: {locationDisplay}
              </span>
              <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-sm font-medium text-foreground">
                Role: {role}
              </span>
            </div>
          </div>
        </Card>

        {/* Today strip */}
        <Card className="mb-6 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-semibold text-foreground">
                {new Date().toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Cash Sheet Status</p>
              <p
                className={`font-semibold ${
                  isLoadingToday
                    ? "text-muted-foreground"
                    : sale
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {isLoadingToday ? "Loading..." : sale ? "Submitted" : "Not Submitted"}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Editing Allowed</p>
              <p className="font-semibold text-foreground">
                {isPrivileged ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-semibold text-foreground">
                {summary?.updatedAt
                  ? new Date(summary.updatedAt).toLocaleTimeString()
                  : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <Tabs defaultValue="entry" className="w-full">
            <TabsList className="bg-muted/40">
              <TabsTrigger value="entry">Sales Entry</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="entry" className="mt-6">
              {showEntryForm ? (
                <SalesEntryForm
                  mode={!sale ? "create" : "edit"}
                  initialSale={sale ?? undefined}
                  requireEditNote={!!sale && isPrivileged}
                  onCancelEdit={() => setIsEditing(false)}
                  onSubmitted={() => {
                    setIsEditing(false);
                  }}
                />
              ) : (
                <Card className="rounded-2xl border border-border/60 bg-muted/20 p-6 shadow-none">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Today’s Sales Submitted
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Entry is locked for staff. Contact an administrator for corrections.
                      </p>
                    </div>

                    {isPrivileged && (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          Edit
                        </Button>
                        <Button variant="destructive">
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator className="my-5 bg-border/60" />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                      <p className="text-sm text-muted-foreground">Total Cash</p>
                      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        {money(Number(summary?.cashTotal))}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background p-4">
                      <p className="text-sm text-muted-foreground">Credit Card</p>
                      <p className="text-lg font-semibold text-foreground">
                        {money(Number(summary?.credit))}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background p-4">
                      <p className="text-sm text-muted-foreground">Debit Card</p>
                      <p className="text-lg font-semibold text-foreground">
                        {money(Number(summary?.debit))}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background p-4">
                      <p className="text-sm text-muted-foreground">Cheque</p>
                      <p className="text-lg font-semibold text-foreground">
                        {money(Number(summary?.cheque))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/10 p-5">
                    <p className="text-base font-semibold text-foreground">Grand Total</p>
                    <p className="text-2xl font-bold text-primary">
                      {money(Number(summary?.grand))}
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <SalesHistory />
            </TabsContent>
          </Tabs>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sales entries are logged and audited. Contact an administrator for corrections.
        </p>
      </div>
    </div>
  );
}