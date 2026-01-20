import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import z from "zod";
import { Prisma, Location, Role } from "@prisma/client";

/**
 * DTOs
 */
type SaleDTO = {
  id: number;
  locationId: number;
  salesDate: string;

  hundredsCount: number;
  fiftiesCount: number;
  twentiesCount: number;
  tensCount: number;
  fivesCount: number;

  cashTotal: string;
  grandTotal: string;

  creditCardTotal: string;
  debitCardTotal: string;
  chequeTotal: string;

  notes?: string | null;
  enteredBy: string;

  createdAt: string;
  updatedAt: string;
};

type SalesAnalyticsDTO = {
  sales: SaleDTO[];
  analytics: {
    totalSales: number;
    totalCash: number;
    totalCard: number;
    salesByLocation: Array<{
      locationId: number;
      totalSales: number;
      count: number;
    }>;
  };
};

/**
 * Zod schema
 * - Your Prisma model uses Decimal for totals.
 * - API clients often send numbers or numeric strings.
 * - This accepts both safely and converts to number.
 */
const numberLike = z.union([z.number(), z.string()]).transform((v) => {
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) throw new Error("Invalid number");
  return n;
});

const saleSchema = z.object({
  // ✅ zod uses .datetime() on string (not z.iso.datetime()) for most setups
  salesDate: z.string().datetime(),

  hundredsCount: z.number().int().min(0),
  fiftiesCount: z.number().int().min(0),
  twentiesCount: z.number().int().min(0),
  tensCount: z.number().int().min(0),
  fivesCount: z.number().int().min(0),

  cashTotal: numberLike.pipe(z.number().min(0)),
  grandTotal: numberLike.pipe(z.number().positive()),

  creditCardTotal: numberLike.pipe(z.number().min(0)),
  debitCardTotal: numberLike.pipe(z.number().min(0)),
  chequeTotal: numberLike.pipe(z.number().min(0)),

  notes: z.string().optional(),
});

/**
 * Location map (Users.location enum -> numeric locationId used by Sale)
 * Keep your exact enum spellings.
 */
const LOCATION_ID: Record<Location, number> = {
  Tapion: 1,
  blueCoral: 2,
  manoelStreet: 3,
  sunnyAcres: 4,
  emCare: 5,
  RodneyBay: 6,
  memberCare: 7,
  vieuxFort: 8,
  soufriere: 9,
  other: 10,
};

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Prisma Decimal -> string safe DTO
 */
function toSaleDTO(sale: any): SaleDTO {
  return {
    id: sale.id,
    locationId: sale.locationId,
    salesDate: sale.salesDate.toISOString(),

    hundredsCount: sale.hundredsCount,
    fiftiesCount: sale.fiftiesCount,
    twentiesCount: sale.twentiesCount,
    tensCount: sale.tensCount,
    fivesCount: sale.fivesCount,

    cashTotal: sale.cashTotal.toString(),
    grandTotal: sale.grandTotal.toString(),

    creditCardTotal: sale.creditCardTotal.toString(),
    debitCardTotal: sale.debitCardTotal.toString(),
    chequeTotal: sale.chequeTotal.toString(),

    notes: sale.notes,
    enteredBy: sale.enteredBy,

    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
  };
}

async function createAuditLog(params: {
  salesId: number;
  action: "CREATED" | "UPDATED" | "DELETED";
  columnName: string;
  oldValue: string;
  changedBy: string;
}) {
  await prisma.salesAuditLog.create({
    data: {
      salesId: params.salesId,
      action: params.action,
      columnName: params.columnName,
      oldValue: params.oldValue,
      changedBy: params.changedBy,
    },
  });
}

/**
 * CREATE
 */
export const createSale = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { name?: string; email: string; location: Location; role: Role } | undefined;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });

    const validation = saleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid sales data",
        error: validation.error.flatten(),
      });
    }

    const data = validation.data;
    const locationId = LOCATION_ID[user.location];
    if (!locationId) return res.status(400).json({ message: "Invalid user location" });

    // ✅ normalize to start-of-day so @@unique([locationId, salesDate]) is stable
    const salesDate = startOfLocalDay(new Date(data.salesDate));

    const existing = await prisma.sale.findUnique({
      where: {
        locationId_salesDate: {
          locationId,
          salesDate,
        },
      },
    });

    // ✅ if it EXISTS -> conflict
    if (existing) {
      return res.status(409).json({ message: "Sale already exists. Please update instead." });
    }

    const created = await prisma.sale.create({
      data: {
        locationId,
        salesDate,

        hundredsCount: data.hundredsCount,
        fiftiesCount: data.fiftiesCount,
        twentiesCount: data.twentiesCount,
        tensCount: data.tensCount,
        fivesCount: data.fivesCount,

        cashTotal: new Prisma.Decimal(data.cashTotal),
        grandTotal: new Prisma.Decimal(data.grandTotal),

        creditCardTotal: new Prisma.Decimal(data.creditCardTotal),
        debitCardTotal: new Prisma.Decimal(data.debitCardTotal),
        chequeTotal: new Prisma.Decimal(data.chequeTotal),

        notes: data.notes,
        enteredBy: user.name ?? user.email,
      },
    });

    await createAuditLog({
      salesId: created.id,
      action: "CREATED",
      columnName: "all",
      oldValue: "",
      changedBy: user.name ?? user.email,
    });

    return res.status(201).json({ sale: toSaleDTO(created), message: "Sale created successfully" });
  } catch (err) {
    console.error("❌ createSale error:", err);
    return res.status(500).json({ message: "Failed to create sale" });
  }
};

/**
 * UPDATE
 */
export const updateSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = (req as any).user as { name?: string; email: string; location: Location; role: Role } | undefined;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });

    const validation = saleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid sales data",
        error: validation.error.flatten(),
      });
    }

    const data = validation.data;

    const existing = await prisma.sale.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) return res.status(404).json({ message: "Sale not found." });

    // Permissions: same location OR admin
    const userLocationId = LOCATION_ID[user.location];
    if (existing.locationId !== userLocationId && user.role !== "admin") {
      return res.status(403).json({ message: "You are not allowed to update this sale." });
    }

    const newSalesDate = startOfLocalDay(new Date(data.salesDate));

    const updated = await prisma.sale.update({
      where: { id: Number(id) },
      data: {
        salesDate: newSalesDate,

        hundredsCount: data.hundredsCount,
        fiftiesCount: data.fiftiesCount,
        twentiesCount: data.twentiesCount,
        tensCount: data.tensCount,
        fivesCount: data.fivesCount,

        cashTotal: new Prisma.Decimal(data.cashTotal),
        grandTotal: new Prisma.Decimal(data.grandTotal),

        creditCardTotal: new Prisma.Decimal(data.creditCardTotal),
        debitCardTotal: new Prisma.Decimal(data.debitCardTotal),
        chequeTotal: new Prisma.Decimal(data.chequeTotal),

        notes: data.notes,
      },
    });

    // ✅ audit changes correctly (compare against existing)
    const changeCandidates: Array<keyof typeof data> = [
      "salesDate",
      "hundredsCount",
      "fiftiesCount",
      "twentiesCount",
      "tensCount",
      "fivesCount",
      "cashTotal",
      "grandTotal",
      "creditCardTotal",
      "debitCardTotal",
      "chequeTotal",
      "notes",
    ];

    for (const key of changeCandidates) {
      const before =
        key === "salesDate"
          ? existing.salesDate.toISOString()
          : (existing as any)[key]?.toString?.() ?? String((existing as any)[key] ?? "");

      const after =
        key === "salesDate"
          ? newSalesDate.toISOString()
          : (key === "notes" ? (data.notes ?? "") : String((data as any)[key]));

      if (before !== after) {
        await createAuditLog({
          salesId: updated.id,
          action: "UPDATED",
          columnName: String(key),
          oldValue: before,
          changedBy: user.name ?? user.email,
        });
      }
    }

    return res.json({ sale: toSaleDTO(updated), message: "Sale updated successfully" });
  } catch (err: any) {
    // Prisma unique constraint error (if someone changes salesDate to a day that already exists)
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "A sale already exists for this location and date." });
    }
    console.error("❌ updateSale error:", err);
    return res.status(500).json({ message: "Error updating sale." });
  }
};

/**
 * GET today's sale (for the user's location)
 */
export const getTodaySale = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { location: Location } | undefined;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });

    const locationId = LOCATION_ID[user.location];
    if (!locationId) return res.status(400).json({ message: "Invalid user location" });

    const today = startOfLocalDay(new Date());

    const sale = await prisma.sale.findUnique({
      where: {
        locationId_salesDate: {
          locationId,
          salesDate: today,
        },
      },
    });

    return res.json({ sale: sale ? toSaleDTO(sale) : null });
  } catch (err) {
    console.error("❌ getTodaySale error:", err);
    return res.status(500).json({ message: "Error getting today sale." });
  }
};

/**
 * GET sales for current user's location (optional date range)
 */
export const getSalesByLocation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { location: Location } | undefined;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });

    const locationId = LOCATION_ID[user.location];
    if (!locationId) return res.status(400).json({ message: "Invalid user location" });

    const { startDate, endDate } = req.query;

    const where: Prisma.SaleWhereInput = { locationId };

    if (startDate && endDate) {
      where.salesDate = {
        gte: startOfLocalDay(new Date(String(startDate))),
        lte: endOfLocalDay(new Date(String(endDate))),
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { salesDate: "desc" },
    });

    return res.json({ sales: sales.map(toSaleDTO) });
  } catch (err) {
    console.error("❌ getSalesByLocation error:", err);
    return res.status(500).json({ message: "Error retrieving sales" });
  }
};

/**
 * ANALYTICS (admin can filter by locationId, others can be restricted if you want)
 */
export const getSalesAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    const where: Prisma.SaleWhereInput = {};

    if (locationId && String(locationId) !== "all") {
      where.locationId = Number(locationId);
    }

    if (startDate && endDate) {
      where.salesDate = {
        gte: startOfLocalDay(new Date(String(startDate))),
        lte: endOfLocalDay(new Date(String(endDate))),
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { salesDate: "desc" },
    });

    const totalSales = sales.reduce((acc, s) => acc + Number(s.grandTotal), 0);
    const totalCash = sales.reduce((acc, s) => acc + Number(s.cashTotal), 0);
    const totalCard = sales.reduce(
      (acc, s) => acc + Number(s.creditCardTotal) + Number(s.debitCardTotal),
      0
    );

    const byLocationMap = new Map<number, { locationId: number; totalSales: number; count: number }>();
    for (const s of sales) {
      const curr = byLocationMap.get(s.locationId) ?? { locationId: s.locationId, totalSales: 0, count: 0 };
      curr.totalSales += Number(s.grandTotal);
      curr.count += 1;
      byLocationMap.set(s.locationId, curr);
    }

    const dto: SalesAnalyticsDTO = {
      sales: sales.map(toSaleDTO),
      analytics: {
        totalSales,
        totalCash,
        totalCard,
        salesByLocation: Array.from(byLocationMap.values()),
      },
    };

    return res.json(dto);
  } catch (err) {
    console.error("❌ getSalesAnalytics error:", err);
    return res.status(500).json({ message: "Error retrieving analytics." });
  }
};

/**
 * DELETE
 */
export const deleteSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = (req as any).user as { email: string; name?: string; role: Role; location: Location } | undefined;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });

    const sale = await prisma.sale.findUnique({
      where: { id: Number(id) },
    });

    if (!sale) return res.status(404).json({ message: "Sale not found." });

    // (Optional) restrict delete to admin or same location:
    const userLocationId = LOCATION_ID[user.location];
    if (sale.locationId !== userLocationId && user.role !== "admin") {
      return res.status(403).json({ message: "You are not allowed to delete this sale." });
    }

    await createAuditLog({
      salesId: sale.id,
      action: "DELETED",
      columnName: "all",
      oldValue: JSON.stringify({
        ...sale,
        cashTotal: sale.cashTotal.toString(),
        grandTotal: sale.grandTotal.toString(),
        creditCardTotal: sale.creditCardTotal.toString(),
        debitCardTotal: sale.debitCardTotal.toString(),
        chequeTotal: sale.chequeTotal.toString(),
      }),
      changedBy: user.name ?? user.email,
    });

    await prisma.sale.delete({
      where: { id: Number(id) },
    });

    return res.json({ message: "Sale deleted successfully" });
  } catch (err) {
    console.error("❌ deleteSale error:", err);
    return res.status(500).json({ message: "Error deleting sale." });
  }
};
