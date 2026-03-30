"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Send,
  XCircle,
  AlertCircle,
} from "lucide-react";

import {
  useFulfillStockRequestMutation,
  useGetStockRequestByIdQuery,
  useReviewStockRequestMutation,
} from "@/app/state/api";

import { SkeletonDemo } from "@/app/(components)/shared/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import StockRequestPDFDownload from "@/app/pdf/StockRequestPDFDownload";

type StockLineOutcome = "PENDING" | "GRANTED" | "ADJUSTED" | "UNAVAILABLE";
type Outcome = "GRANTED" | "ADJUSTED" | "UNAVAILABLE";

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "FULFILLED":
      return "default";
    case "IN_REVIEW":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusBadgeColor(status: string) {
  const colors: Record<string, string> = {
    SUBMITTED:
      "border-primary/20 bg-primary/10 text-primary",
    IN_REVIEW:
      "border-amber-200/50 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:text-amber-400",
    FULFILLED:
      "border-emerald-200/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400",
    CANCELLED:
      "border-red-200/50 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:text-red-400",
  };
  return colors[status] || "border-border/60 bg-muted/40 text-foreground";
}

function getOutcomeBadgeColor(outcome: StockLineOutcome) {
  const colors: Record<StockLineOutcome, string> = {
    GRANTED:
      "border-emerald-200/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400",
    ADJUSTED:
      "border-amber-200/50 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:text-amber-400",
    UNAVAILABLE:
      "border-red-200/50 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:text-red-400",
    PENDING:
      "border-border/60 bg-muted/40 text-foreground",
  };
  return colors[outcome];
}

function getOutcomeIcon(outcome: StockLineOutcome) {
  const icons: Record<StockLineOutcome, JSX.Element> = {
    GRANTED: <CheckCircle2 className="h-3 w-3" />,
    ADJUSTED: <Clock className="h-3 w-3" />,
    UNAVAILABLE: <XCircle className="h-3 w-3" />,
    PENDING: <Package className="h-3 w-3" />,
  };
  return icons[outcome];
}

function normalizeGranted(
  availableQty: number,
  requestedQty: number,
  grantedQty: number
): { grantedQty: number; outcome: Outcome } {
  const available = Math.max(0, Number(availableQty) || 0);
  const requested = Math.max(0, Number(requestedQty) || 0);
  const granted = Math.max(0, Number(grantedQty) || 0);

  if (available === 0) return { grantedQty: 0, outcome: "UNAVAILABLE" };
  if (available < requested) return { grantedQty: available, outcome: "ADJUSTED" };

  const clamped = Math.min(granted, available);

  if (clamped === requested) return { grantedQty: clamped, outcome: "GRANTED" };
  return { grantedQty: clamped, outcome: "ADJUSTED" };
}

export default function StockRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, isError } = useGetStockRequestByIdQuery(id);
  const [review, { isLoading: isSaving }] = useReviewStockRequestMutation();
  const [fulfill, { isLoading: isFulfilling }] = useFulfillStockRequestMutation();

  const isReadOnly = data?.status === "FULFILLED" || data?.status === "CANCELLED";

  const [messageToRequester, setMessageToRequester] = useState("");
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState("");
  const [linesState, setLinesState] = useState<any[]>([]);

  useEffect(() => {
    if (!data) return;

    setMessageToRequester(data.messageToRequester ?? "");
    setExpectedDeliveryAt(
      data.expectedDeliveryAt ? data.expectedDeliveryAt.slice(0, 16) : ""
    );

    const initial = data.lines.map((l: any) => {
      const initialGranted = l.grantedQty ?? l.requestedQty;
      const normalized = normalizeGranted(
        l.availableQty ?? 0,
        l.requestedQty,
        initialGranted
      );

      return {
        ...l,
        grantedQty: normalized.grantedQty,
        outcome: normalized.outcome,
      };
    });

    setLinesState(initial);
  }, [data]);

  const canSave = useMemo(() => {
    if (!data) return false;
    return linesState.every((l) => typeof l.grantedQty === "number");
  }, [data, linesState]);

  const handleGrantedChange = useCallback(
    (lineId: string, rawValue: string) => {
      if (isReadOnly) return;

      const nextValue = Number(rawValue || 0);

      setLinesState((prev) =>
        prev.map((l) => {
          if (l.id !== lineId) return l;

          const { grantedQty, outcome } = normalizeGranted(
            l.availableQty ?? 0,
            l.requestedQty,
            nextValue
          );

          return { ...l, grantedQty, outcome };
        })
      );
    },
    [isReadOnly]
  );

  const handleSaveReview = async () => {
    const toastId = toast.loading("Saving review...");
    try {
      const body = {
        messageToRequester: messageToRequester.trim() || null,
        expectedDeliveryAt: expectedDeliveryAt
          ? new Date(expectedDeliveryAt).toISOString()
          : null,
        lines: linesState.map((l: any) => ({
          lineId: l.id,
          grantedQty: l.grantedQty,
        })),
      };

      await review({ id, body }).unwrap();
      toast.success("Review saved successfully", { id: toastId });
    } catch (error: any) {
      console.error("Failed to save review:", error);
      toast.error("Failed to save review", { id: toastId });
    }
  };

  const handleFulfillRequest = async () => {
    const toastId = toast.loading("Processing fulfillment...");

    try {
      const body = {
        messageToRequester: messageToRequester.trim() || null,
        expectedDeliveryAt: expectedDeliveryAt
          ? new Date(expectedDeliveryAt).toISOString()
          : null,
        lines: linesState.map((l: any) => ({
          lineId: l.id,
          grantedQty: l.grantedQty,
        })),
      };

      await review({ id, body }).unwrap();
      const result = await fulfill(id).unwrap();

      console.log("Fulfill success:", result);
      toast.success("Request fulfilled successfully!", { id: toastId });

      setTimeout(() => {
        router.push("/stock-requests");
      }, 500);
    } catch (err: any) {
      console.error(err);
      toast.error("Error", { id: toastId });
    }
  };

  if (isLoading) return <SkeletonDemo />;

  if (isError || !data) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card className="border-red-200/50 bg-red-500/10 dark:border-red-900/40 dark:bg-red-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-700 dark:text-red-400">
                Failed to load stock request
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="destructive">
                Retry
              </Button>
              <Button asChild variant="outline">
                <Link href="/stock-requests">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to List
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasIssues = linesState.some(
    (l) => l.outcome === "UNAVAILABLE" || l.outcome === "ADJUSTED"
  );

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6">
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl text-foreground">
                  Stock Request Details
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`${getStatusBadgeColor(
                    data.status
                  )} px-3 py-1 text-sm font-semibold`}
                >
                  {data.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <CardDescription className="font-mono text-xs text-muted-foreground">
                Request ID: {data.id}
              </CardDescription>
            </div>

            {hasIssues && data.status === "SUBMITTED" && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-amber-500/10 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  <p className="font-medium">Items need attention</p>
                  <p className="text-amber-700/80 dark:text-amber-400/80">
                    Some items are unavailable or adjusted
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Requester
              </Label>
              <p className="text-base font-medium text-foreground">
                {data.requestedByName}
              </p>
              <p className="text-sm text-muted-foreground">{data.requestedByEmail}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </Label>
              <Badge variant="outline" className="mt-1">
                {data.requestedByLocation}
              </Badge>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Submitted
              </Label>
              <p className="text-sm font-medium text-foreground">
                {new Date(data.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-border/60 pt-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="delivery" className="text-sm font-medium text-foreground">
                Expected Delivery
              </Label>
              <Input
                id="delivery"
                type="datetime-local"
                disabled={isReadOnly}
                value={expectedDeliveryAt}
                onChange={(e) => setExpectedDeliveryAt(e.target.value)}
                className="border-border/60 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-foreground">
                Message to Requester
              </Label>
              <Input
                id="message"
                disabled={isReadOnly}
                value={messageToRequester}
                onChange={(e) => setMessageToRequester(e.target.value)}
                placeholder="e.g., Items will be ready for pickup tomorrow"
                className="border-border/60 bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">
            Requested Items ({linesState.length})
          </CardTitle>
          <div className="flex items-center justify-between gap-2">
            <CardDescription className="text-muted-foreground">
              Review and adjust quantities based on available stock
            </CardDescription>
            <StockRequestPDFDownload
              request={data}
              linesOverride={linesState.map((l: any) => ({
                id: l.id,
                grantedQty: l.grantedQty,
                outcome: l.outcome,
              }))}
              messageOverride={messageToRequester}
              expectedDeliveryOverride={expectedDeliveryAt}
              preparedBy="Hunter"
              notes={
                hasIssues
                  ? "Some line items were adjusted or unavailable. Please review outcomes before fulfillment."
                  : undefined
              }
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold text-muted-foreground">
                    Product
                  </TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground">
                    Available
                  </TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground">
                    Requested
                  </TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground">
                    Granted
                  </TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {linesState.map((line: any) => {
                  const available = line.availableQty ?? 0;
                  const isUnavailable = available === 0;

                  return (
                    <TableRow
                      key={line.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        isUnavailable ? "bg-red-500/5" : ""
                      }`}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{line.productName}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {line.unit ?? "N/A"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {line.department ?? "No dept"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={isUnavailable ? "destructive" : "outline"}
                          className="font-mono"
                        >
                          {available}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {line.requestedQty}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={available}
                            disabled={isReadOnly || isUnavailable}
                            value={line.grantedQty}
                            onChange={(e) =>
                              handleGrantedChange(line.id, e.target.value)
                            }
                            className="w-24 border-border/60 bg-background text-center font-mono"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            max: {available}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`${getOutcomeBadgeColor(
                            line.outcome
                          )} inline-flex items-center gap-1.5 px-2.5 py-1`}
                        >
                          {getOutcomeIcon(line.outcome)}
                          {line.outcome}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            {data.status === "SUBMITTED" && (
              <>
                <Button
                  variant="outline"
                  disabled={!canSave || isSaving}
                  onClick={handleSaveReview}
                  size="lg"
                >
                  <Package className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Review"}
                </Button>

                <Button
                  disabled={isFulfilling || !canSave}
                  onClick={handleFulfillRequest}
                  size="lg"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isFulfilling ? "Processing..." : "Fulfill & Notify"}
                </Button>
              </>
            )}

            {data.status === "IN_REVIEW" && (
              <>
                <Button
                  disabled={isFulfilling}
                  onClick={handleFulfillRequest}
                  size="lg"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isFulfilling ? "Notifying..." : "Fulfill & Notify"}
                </Button>

                <Button asChild variant="outline" size="lg">
                  <Link href="/stock-requests">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Link>
                </Button>
              </>
            )}

            {(data.status === "FULFILLED" || data.status === "CANCELLED") && (
              <Button asChild variant="outline" size="lg">
                <Link href="/stock-requests">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}