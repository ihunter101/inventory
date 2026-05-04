"use client";

import { Landmark, Plus } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  onCreateClick?: () => void;
};

export default function ChequeDraftsHeader({ onCreateClick }: Props) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Landmark className="h-3.5 w-3.5" />
            Cheque Preparation
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Cheque Drafts
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Group unpaid expenses by company, tally the monthly total, and
            prepare an internal cheque draft before entering the cheque in
            QuickBooks Desktop.
          </p>
        </div>

        <motion.button
          type="button"
          onClick={onCreateClick}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          animate={{ y: [0, -3, 0] }}
          transition={{
            y: {
              repeat: Infinity,
              duration: 1.7,
              ease: "easeInOut",
            },
          }}
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Cheque
        </motion.button>
      </div>
    </section>
  );
}