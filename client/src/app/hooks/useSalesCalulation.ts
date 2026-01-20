
// ============================================
// client/src/hooks/useSalesCalculations.ts
// ============================================
import { useMemo } from "react";

interface DenominationCount {
  hundredsCount: number;
  fiftiesCount: number;
  twentiesCount: number;
  tensCount: number;
  fivesCount: number;
}

export function useSalesCalculations(denominations: DenominationCount) {
  return useMemo(() => {
    const cashTotal =
      denominations.hundredsCount * 100 +
      denominations.fiftiesCount * 50 +
      denominations.twentiesCount * 20 +
      denominations.tensCount * 10 +
      denominations.fivesCount * 5;

    return {
      cashTotal,
      formatCurrency: (value: number) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value),
    };
  }, [denominations]);
}
