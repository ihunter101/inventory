import { dmmfToRuntimeDataModel } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import { Organization } from "@clerk/backend";

export async function getOrganizations(req: Request, res: Response) {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        customer: {
          select: {
            customerId: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
            balance: true,
            totalBalance: true,
            customerDetail1: true,
            customerDetail2: true,
            customerDetail3: true,
            subClientName: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            location: true,
            accessStatus: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json({ organizations });
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return res.status(500).json({ message: "Failed to fetch organizations" });
  }
}


/**
 * GET /organizations/available-customers
 * Admin: Customers that are NOT already linked to an organization
 */
export async function getAvailableOrganizationCustomers (req: Request, res: Response) {
  try {
    const customers = await prisma.customer.findMany({
    where: {
      organization: null
    },
    select: {
      customerId: true,
      qbListId: true,
      name: true,
      companyName: true, 
      email: true,
      phone: true,
      balance: true,
      totalBalance: true,
    },
    orderBy: {
      name: "asc"
    }
  })
  res.json({customers})
  } catch (error) {
    console.error("Failed to fetch available customers:", error);
    res.status(500).json({ message: "Failed to fetch available customers" });
  }
}

export async function createOrganization(req: Request, res: Response) {
  try {
const { customerId, name } = req.body;


    if (!customerId && typeof customerId !== "string") {
      return res.status(400).json({ message: "Customer ID required"})
    }

    const customer = await prisma.customer.findUnique({
      where: { customerId },
      include: { organization: true },
    });

    if (!customer) {
      return res.status(404).json({message: "Customer not found"})
    }

    if (customer.organization) {
      return res.status(409).json({
        message: "This customer already has an organization",
        Organization: customer.organization
      })
    }

    const organization = await prisma.organization.create({
      data: {
        name: customer.name || customer.companyName || name,
        customerId: customerId
      },
      include: {
        customer: true,
        users: true,
      }
    })

     res.status(201).json({
      message: "Organization created successfully",
      organization,
     })

  } catch (error) {
     console.error("Failed to create organization:", error);
    res.status(500).json({ message: "Failed to create organization" });
  }
}


/**
 * GET /organizations/:organizationId
 * Admin: View one organization with users and customer info
 */
export async function getOrganizationById(req: Request, res: Response) {
  try {
    const { organizationId } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { organizationId },
      include: {
        customer: {
          include: {
            invoices: {
              orderBy: {
                invoiceDate: "desc",
              },
              take: 20,
            },
            payments: {
              orderBy: {
                paymentDate: "desc",
              },
              take: 20,
            },
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            accessStatus: true,
            onboardedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.json({ organization });
  } catch (error) {
    console.error("Failed to fetch organization:", error);
    res.status(500).json({ message: "Failed to fetch organization" });
  }
}


/**
 * PATCH /users/:userId/organization
 * Admin: Assign a user to an organization
 */
export async function assignUserToOrganization(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is required" });
    }

    const organization = await prisma.organization.findUnique({
      where: { organizationId },
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        organizationId,
      },
      include: {
        organization: {
          include: {
            customer: true,
          },
        },
      },
    });

    res.json({
      message: "User assigned to organization successfully",
      user,
    });
  } catch (error) {
    console.error("Failed to assign user to organization:", error);
    res.status(500).json({ message: "Failed to assign user to organization" });
  }
}