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

  if (!isLoaded) return <div className="p-6">Loading...</div>;
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

  const isPrivileged = role === "admin"; // expand later if you add manager/supervisor
  const sale = todaySaleData?.sale ?? null;

  // page mode: create (no sale), view (sale exists), edit (privileged edits)
  const [isEditing, setIsEditing] = useState(false);

  // once a sale exists, staff should never see the form; admins only if editing
  const showEntryForm = !sale || (isPrivileged && isEditing);

  // build a minimal summary shape (adapt field names to your backend response)
  const summary = useMemo(() => {
    if (!sale) return null;

    // You must map these to your real API fields.
    // Example assumes sale has: totalCash, creditCardTotal, debitCardTotal, chequeTotal, grandTotal
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
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <Card className="mb-8 p-6 border bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Sales Management</h1>
              <p className="text-gray-600 mt-1">
                Record your daily sales for{" "}
                <span className="text-green-600">{locationDisplay}</span> today
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                Location: {locationDisplay}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                Role: {role}
              </span>
            </div>
          </div>
        </Card>

        {/* Today strip */}
        <Card className="mb-6 p-5 border bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-semibold">{new Date().toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-gray-500">Cash Sheet Status</p>
              <p className="font-semibold text-green-700">
                {isLoadingToday ? "Loading..." : sale ? "Submitted" : "Not Submitted"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Editing Allowed</p>
              <p className="font-semibold">{isPrivileged ? "Yes" : "No"}</p>
            </div>

            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="font-semibold">
                {summary?.updatedAt ? new Date(summary.updatedAt).toLocaleTimeString() : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border bg-white">
          <Tabs defaultValue="entry" className="w-full">
            <TabsList>
              <TabsTrigger value="entry">Sales Entry</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="entry" className="mt-6">
              {/* CASE A: No sale yet OR admin chose edit */}
              {showEntryForm ? (
                <SalesEntryForm
                  mode={!sale ? "create" : "edit"}
                  // pass sale to prefill when editing (you implement this inside SalesEntryForm)
                  initialSale={sale ?? undefined}
                  // require note ONLY for edits by privileged users
                  requireEditNote={!!sale && isPrivileged}
                  onCancelEdit={() => setIsEditing(false)}
                  onSubmitted={() => {
                    // after submit/update, always exit edit mode so they see summary state
                    setIsEditing(false);
                  }}
                />
              ) : (
                /* CASE B: Sale submitted -> show summary “empty state” */
                <Card className="p-6 border bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Today’s Sales Submitted
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
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

                  <Separator className="my-5" />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-white border p-4">
                      <p className="text-sm text-gray-500">Total Cash</p>
                      <p className="text-lg font-semibold text-green-700">
                        {money(Number(summary?.cashTotal))}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border p-4">
                      <p className="text-sm text-gray-500">Credit Card</p>
                      <p className="text-lg font-semibold">{money(Number((summary?.credit)))}</p>
                    </div>
                    <div className="rounded-lg bg-white border p-4">
                      <p className="text-sm text-gray-500">Debit Card</p>
                      <p className="text-lg font-semibold">{money(Number(summary?.debit))}</p>
                    </div>
                    <div className="rounded-lg bg-white border p-4">
                      <p className="text-sm text-gray-500">Cheque</p>
                      <p className="text-lg font-semibold">{money(Number(summary?.cheque))}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg bg-white border p-5 flex items-center justify-between">
                    <p className="text-base font-semibold text-gray-900">Grand Total</p>
                    <p className="text-2xl font-bold text-blue-700">{money(Number(summary?.grand))}</p>
                  </div>
                </Card>
            )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <SalesHistory />
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-xs text-gray-500 text-center mt-6">
          Sales entries are logged and audited. Contact an administrator for corrections.
        </p>
      </div>
    </div>
  );
}
