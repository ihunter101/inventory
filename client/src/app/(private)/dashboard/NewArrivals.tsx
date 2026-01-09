"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  useGetPendingPromotionsQuery,
  useBulkFinalizeProductsMutation,
} from "../../state/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { UploadButton } from "@/utils/uploadthing";
import "@uploadthing/react/styles.css";

type DraftForm = {
  category?: string;
  department?: string;
  imageUrl?: string;

  uploading?: boolean;
  uploadError?: string;
};

type DraftRow = {
  id: string;
  name: string;
  unit?: string | null;
  receivedQty?: number | null;
};

export const NewArrivals = () => {
  const searchParams = useSearchParams();
  const grnId = searchParams.get("grnId");

  const { data: drafts, isLoading, error } = useGetPendingPromotionsQuery(
    grnId ? { grnId } : undefined
  );

  const [bulkUpdate, { isLoading: isSaving }] = useBulkFinalizeProductsMutation();

  const [formState, setFormState] = useState<Record<string, DraftForm>>({});
  const [masterValues, setMasterValues] = useState({ category: "", department: "" });

  const updateField = (draftId: string, field: keyof DraftForm, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [draftId]: { ...(prev[draftId] || {}), [field]: value },
    }));
  };

  const safeDrafts = (drafts ?? []) as DraftRow[];

  const isRowValid = (d: DraftRow) => {
    const row = formState[d.id] || {};
    const category = (row.category || masterValues.category || "").trim();
    const department = (row.department || masterValues.department || "").trim();
    const imageUrl = (row.imageUrl || "").trim();
    return !!category && !!department && !!imageUrl;
  };

  const hasUploading = Object.values(formState).some((row) => row.uploading);
  const canSubmit =
    safeDrafts.length > 0 && safeDrafts.every(isRowValid) && !hasUploading;

  const onSaveAll = async () => {
    if (!safeDrafts.length) return;

    const updates = safeDrafts.map((d) => {
      const row = formState[d.id] || {};
      return {
        productId: d.id,
        category: (row.category || masterValues.category || "").trim(),
        department: (row.department || masterValues.department || "").trim(),
        imageUrl: (row.imageUrl || "").trim(),
      };
    });

    try {
      await bulkUpdate({ updates }).unwrap();
      toast.success(
        `Successfully promoted ${safeDrafts.length} product${
          safeDrafts.length !== 1 ? "s" : ""
        }!`
      );
      setFormState({});
      setMasterValues({ category: "", department: "" });
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to promote products");
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <p className="text-red-800 font-semibold">Error loading pending promotions</p>
        <pre className="text-xs text-red-600 mt-2">{JSON.stringify(error, null, 2)}</pre>
      </Card>
    );
  }

  if (!safeDrafts.length) {
    return (
      <Card className="border-dashed border-2 p-8 text-center text-muted-foreground">
        <p>No pending promotions found.</p>
        {grnId && <p className="text-xs mt-2">Filtered by GRN: {grnId}</p>}
      </Card>
    );
  }

  return (
    <Card className="border-2 border-green-500/20 p-6 shadow-xl">
      <div className="flex flex-col gap-6">
        {/* APPLY ALL */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-bold text-green-800 uppercase mb-3">
            Option A: Set All Items at Once
          </h3>

          <div className="flex gap-4 items-end flex-wrap">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium">Common Category</label>
              <Input
                value={masterValues.category}
                onChange={(e) =>
                  setMasterValues({ ...masterValues, category: e.target.value })
                }
                placeholder="e.g. phlebotomy"
                className="bg-white"
              />
            </div>

            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium">Common Department</label>
              <Input
                value={masterValues.department}
                onChange={(e) =>
                  setMasterValues({ ...masterValues, department: e.target.value })
                }
                placeholder="e.g. Laboratory"
                className="bg-white"
              />
            </div>

            <p className="text-xs text-green-600 pb-2 italic">
              This will apply to any blank fields below
            </p>
          </div>
        </div>

        {/* INDIVIDUAL DETAILS */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase mb-3">
            Option B: Individual Details
          </h3>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Product Name</TableHead>
                  <TableHead className="font-bold">Unit</TableHead>
                  <TableHead className="font-bold">Qty Received</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Department</TableHead>
                  <TableHead className="font-bold">Image</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {safeDrafts.map((draft) => {
                  const row = formState[draft.id] || {};
                  const hasImage = !!row.imageUrl;

                  return (
                    <TableRow key={draft.id}>
                      <TableCell className="font-bold">{draft.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {draft.unit || "—"}
                      </TableCell>
                      <TableCell className="font-medium text-green-700">
                        {draft.receivedQty ?? 0}
                      </TableCell>

                      <TableCell>
                        <Input
                          placeholder={masterValues.category || "Category"}
                          value={row.category || ""}
                          onChange={(e) => updateField(draft.id, "category", e.target.value)}
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          placeholder={masterValues.department || "Department"}
                          value={row.department || ""}
                          onChange={(e) => updateField(draft.id, "department", e.target.value)}
                        />
                      </TableCell>

                      {/* ✅ FIXED IMAGE CELL */}
                      <TableCell className="min-w-[260px]">
                        <div className="flex items-center gap-3">
                          {/* Preview */}
                          <div className="h-12 w-12 rounded border bg-muted overflow-hidden flex items-center justify-center">
                            {hasImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.imageUrl}
                                alt={draft.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                No image
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            {/* ✅ Keep UploadButton mounted always */}
                            <div className="flex items-center gap-2">
                              <div
                                className={row.uploading ? "pointer-events-none opacity-60" : ""}
                              >
                                <UploadButton
                                  endpoint="imageUploader"
                                  content={{
                                    button: hasImage ? "Change Image" : "Add Image",
                                    allowedContent: "Images up to 4MB",
                                  }}
                                  onUploadBegin={() => {
                                    updateField(draft.id, "uploading", true);
                                    updateField(draft.id, "uploadError", "");
                                  }}
                                  onClientUploadComplete={(res) => {
                                    const file = res?.[0];
                                    if (!file?.ufsUrl) {
                                      updateField(draft.id, "uploading", false);
                                      updateField(
                                        draft.id,
                                        "uploadError",
                                        "Upload finished but no URL returned."
                                      );
                                      toast.error("Upload failed (no URL returned)");
                                      return;
                                    }

                                    updateField(draft.id, "imageUrl", file.ufsUrl);
                                    updateField(draft.id, "uploading", false);
                                    updateField(draft.id, "uploadError", "");
                                    toast.success("Image uploaded");
                                  }}
                                  onUploadError={(err: Error) => {
                                    updateField(draft.id, "uploading", false);
                                    updateField(draft.id, "uploadError", err.message);
                                    toast.error(`Upload failed: ${err.message}`);
                                  }}
                                />
                              </div>

                              {hasImage && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateField(draft.id, "imageUrl", "")}
                                  disabled={!!row.uploading}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>

                            {/* Status */}
                            {row.uploading && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                Uploading…
                              </div>
                            )}

                            {!row.uploading && hasImage && (
                              <p className="text-xs text-green-700">Selected ✓</p>
                            )}

                            {!!row.uploadError && (
                              <p className="text-xs text-red-600">{row.uploadError}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {!canSubmit && (
            <p className="mt-3 text-xs text-muted-foreground">
              To publish, each item needs a <span className="font-medium">Category</span>,{" "}
              <span className="font-medium">Department</span>, and an{" "}
              <span className="font-medium">Image</span>.
            </p>
          )}
        </div>

        <Button
          onClick={onSaveAll}
          size="lg"
          disabled={!canSubmit || isSaving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isSaving
            ? "Publishing…"
            : hasUploading
            ? "Waiting for uploads to complete…"
            : `Finalize and Publish ${safeDrafts.length} Product${
                safeDrafts.length !== 1 ? "s" : ""
              }`}
        </Button>
      </div>
    </Card>
  );
};
