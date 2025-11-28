// File: src/app/api/inventory/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL!;
// e.g. http://localhost:8000

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") || "full";

    // Forward cookies so the backend sees the same auth as the browser
    const cookie = request.headers.get("cookie") ?? "";

    const res = await fetch(`${API_BASE_URL}/inventory`, {
      cache: "no-store",
      headers: {
        cookie,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "<no body>");
      console.error("Inventory PDF GET failed:", res.status, text);
      return NextResponse.json(
        { error: "Failed to fetch inventory" },
        { status: 500 }
      );
    }

    const allItems = await res.json();

    // Optionally filter based on reportType
    let items = allItems;
    if (reportType === "low-stock") {
      items = allItems.filter((i: any) =>
        i.status?.toLowerCase?.() === "low stock"
      );
    } else if (reportType === "expired") {
      const now = new Date();
      items = allItems.filter((i: any) => {
        const d = i.expiryDate ? new Date(i.expiryDate) : null;
        return d && d < now;
      });
    }

    return NextResponse.json({
      items,
      reportType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
