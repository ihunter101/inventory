
// ============================================
// client/src/hooks/useSalesValidation.ts
// ============================================
import { useState, useEffect } from "react";

interface SalesData {
  cashTotal: number;
  creditCardTotal: number;
  debitCardTotal: number;
  chequeTotal: number;
  grandTotal: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function useSalesValidation(salesData: SalesData): ValidationResult {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
  });

  useEffect(() => {
    const errors: string[] = [];

    // Check if grand total matches sum of payment methods
    const calculatedTotal =
      salesData.cashTotal +
      salesData.creditCardTotal +
      salesData.debitCardTotal +
      salesData.chequeTotal;

    const difference = Math.abs(calculatedTotal - salesData.grandTotal);
    
    if (difference > 0.01) {
      errors.push(
        `Grand total (${salesData.grandTotal}) doesn't match sum of payments (${calculatedTotal})`
      );
    }

    // Check for negative values
    Object.entries(salesData).forEach(([key, value]) => {
      if (value < 0) {
        errors.push(`${key} cannot be negative`);
      }
    });

    // Check if there are any sales
    if (salesData.grandTotal === 0) {
      errors.push("Grand total must be greater than 0");
    }

    setValidation({
      isValid: errors.length === 0,
      errors,
    });
  }, [salesData]);

  return validation;
}