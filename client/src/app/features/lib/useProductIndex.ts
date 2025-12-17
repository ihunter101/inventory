"use client";

import * as React from "react";
import type { Product, ProductDraft } from "@/app/state/api";
import type { ProductIndex } from "./types";

export function useProductIndex(productDraft: ProductDraft[]): ProductIndex {
  return React.useMemo(() => {
    const byId = new Map<string, ProductDraft>();
    const byName = new Map<string, ProductDraft>();

    for (const p of productDraft) {
      byId.set(p.id, p);
      byName.set(p.name.trim().toLowerCase(), p);
    }

    return { byId, byName };
  }, [productDraft]);
}
