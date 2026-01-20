"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

export type DocType = "purchase-order" | "goods-receipt" | "invoice";

export function useSendDocumentEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const sendEmail = async (args: {
    docType: DocType;
    docId: string;
    docNumber: string;
    recipientEmail: string;
  }) => {
    if (!isLoaded) {
      toast.error("Auth is still loading. Try again.");
      throw new Error("Auth not loaded yet");
    }

    if (!isSignedIn) {
      toast.error("Please sign in.");
      throw new Error("Not signed in");
    }

    setIsLoading(true);

    try {
      const token = await getToken({ template: "express_backend" });

      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        throw new Error("No token");
      }

      const res = await fetch("http://localhost:8000/emails/send-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // IMPORTANT: no colon after Bearer
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(args),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to send email");

      return data;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendEmail, isLoading };
}
