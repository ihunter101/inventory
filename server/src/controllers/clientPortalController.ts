import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Helper:
 * Gets the logged-in DB user.
 *
 * Adjust this depending on how your auth middleware stores the user.
 * Some apps use req.user.
 * Some use req.auth.
 * Some use clerkId from getAuth(req).
 */
async function getCurrentUser(req: Request) {
  const clerkId = (req as any).auth?.userId || (req as any).user?.clerkId;

  if (!clerkId) {
    return null;
  }

  return prisma.users.findUnique({
    where: { clerkId },
    include: {
      organization: {
        include: {
          customer: true,
        },
      },
    },
  });
}

/**
 * GET /client/invoices
 * Client: View invoices belonging only to their organization/customer
 */
export async function getClientInvoices(req: Request, res: Response) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.accessStatus !== "granted") {
      return res.status(403).json({ message: "Access not granted" });
    }

    if (!user.organizationId || !user.organization?.customerId) {
      return res.status(403).json({
        message: "User is not assigned to an organization",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = String(req.query.search ?? "").trim();

    const where = {
      customerId: user.organization.customerId,
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" as const } },
              { qbTxnNumber: { contains: search, mode: "insensitive" as const } },
              { customerName: { contains: search, mode: "insensitive" as const } },
              { subClientName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, invoices] = await Promise.all([
      prisma.customerInvoice.count({ where }),
      prisma.customerInvoice.findMany({
        where,
        select: {
          invoiceId: true,
          qbTxnId: true,
          qbTxnNumber: true,
          invoiceNumber: true,
          customerName: true,
          subClientName: true,
          invoiceDate: true,
          dueDate: true,
          totalAmount: true,
          amountPaid: true,
          balanceRemaining: true,
          status: true,
          memo: true,
          createdAt: true,
        },
        orderBy: {
          invoiceDate: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch client invoices:", error);
    res.status(500).json({ message: "Failed to fetch client invoices" });
  }
}

/**
 * GET /client/invoices/:invoiceId
 * Client: View one invoice, but only if it belongs to their organization/customer
 */
export async function getClientInvoiceById(req: Request, res: Response) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.accessStatus !== "granted") {
      return res.status(403).json({ message: "Access not granted" });
    }

    if (!user.organizationId || !user.organization?.customerId) {
      return res.status(403).json({
        message: "User is not assigned to an organization",
      });
    }

    const { invoiceId } = req.params;

    const invoice = await prisma.customerInvoice.findFirst({
      where: {
        invoiceId,
        customerId: user.organization.customerId,
      },
      include: {
        lines: {
          orderBy: {
            createdAt: "asc",
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
        customer: {
          select: {
            customerId: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found or you do not have access to it",
      });
    }

    res.json({ invoice });
  } catch (error) {
    console.error("Failed to fetch client invoice:", error);
    res.status(500).json({ message: "Failed to fetch client invoice" });
  }
}

/**
 * GET /client/dashboard
 * Client: Simple dashboard summary
 */
export async function getClientDashboard(req: Request, res: Response) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.accessStatus !== "granted") {
      return res.status(403).json({ message: "Access not granted" });
    }

    if (!user.organizationId || !user.organization?.customerId) {
      return res.status(403).json({
        message: "User is not assigned to an organization",
      });
    }

    const customerId = user.organization.customerId;

    const [invoiceStats, openInvoices, recentInvoices] = await Promise.all([
      prisma.customerInvoice.aggregate({
        where: {
          customerId,
        },
        _sum: {
          totalAmount: true,
          amountPaid: true,
          balanceRemaining: true,
        },
        _count: {
          invoiceId: true,
        },
      }),

      prisma.customerInvoice.count({
        where: {
          customerId,
          status: {
            in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"],
          },
        },
      }),

      prisma.customerInvoice.findMany({
        where: {
          customerId,
        },
        select: {
          invoiceId: true,
          invoiceNumber: true,
          qbTxnNumber: true,
          invoiceDate: true,
          dueDate: true,
          totalAmount: true,
          amountPaid: true,
          balanceRemaining: true,
          status: true,
        },
        orderBy: {
          invoiceDate: "desc",
        },
        take: 5,
      }),
    ]);

    res.json({
      organization: {
        organizationId: user.organization.organizationId,
        name: user.organization.name,
      },
      customer: user.organization.customer,
      summary: {
        totalInvoices: invoiceStats._count.invoiceId,
        totalBilled: invoiceStats._sum.totalAmount ?? 0,
        totalPaid: invoiceStats._sum.amountPaid ?? 0,
        totalOutstanding: invoiceStats._sum.balanceRemaining ?? 0,
        openInvoices,
      },
      recentInvoices,
    });
  } catch (error) {
    console.error("Failed to fetch client dashboard:", error);
    res.status(500).json({ message: "Failed to fetch client dashboard" });
  }
}