import { Request, Response} from "express"
import { prisma } from "../lib/prisma"
import resend from "../config/resend";
import { Resend } from "resend";
import { xFrameOptions } from "helmet";

function clampInt(n: number, min = 1) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.max(min, x);
}

export const createStockSheet = async (req: Request, res: Response) => {
    try {
        const body = req.body

        if (!body?.lines || !Array.isArray(body.lines) || body.lines.length === 0 ) {
            return res.status(400).json({message: "lines is required"})
        }

        const requester = (req as any).user as
        | { id?: string; name: string; email: string; location: string }
        | undefined;

        if (!requester?.email) {
            return res.status(401).json({message: "Not Authenticated"})
        }

        const normalized = body.lines.map((l: any) => ({
            productId: l.productId,
            requestedQty: clampInt(l.requestedQty, 1)
        }))

        const created = await prisma.stockRequest.create({
            data: {
                requestedByName: requester.name,
                requestedByEmail: requester.email,
                requestedByLocation: requester.location as any,
                requestedByUserId: requester.id ?? null,
                lines: {
                    create: normalized.map((l: any) => ({
                        productId: l.productId,
                        requestedQty: l.requestedQty
                    }))
                }
            },
            include: {
                lines: {
                    include: {
                        product: {
                            select: { name: true, unit: true, Department: true, }
                        }
                    }
                }
            }
        });

        const recipients = await prisma.users.findMany({
            where: {
                role: { in:  ["admin", "inventoryClerk"]}
            }
        })
        console.log("recipients:", recipients)

        const to = recipients.map((r: any)=> r.email).filter(Boolean);
        console.log("Send to:", to)

        if (to.length === 0) {
            console.log("No valid recipients found, skipping email");
            return res.status(201).json({
                id: created.id,
                status: created.status,
                submittedAt: created.submittedAt,
                emailSent: false
            });
        }

        const linesHtml = created.lines
            .map((l) => {
                const unit = l.product.unit ?? "";
                const dept = l.product.Department ?? "";
                return `<tr>
                    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${l.product.name}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${unit}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${dept}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${l.requestedQty}</td>
                </tr>`
            }).join("")

        // ✅ Destructure the response to check for errors
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_SENDER_EMAIL ?? "noreply@hgautomations.com",
            to, // This should be an array of strings
            replyTo: requester.email,
            subject: `New Stock Request - ${created.requestedByLocation}`, // Fixed spacing
            html: `
                <div style="font-family: Arial, sans-serif;">
                <h2 style="margin:0 0 8px;">New Stock Request</h2>
                <p style="margin:0 0 12px;">
                <strong>From:</strong> ${created.requestedByName} (${created.requestedByEmail})<br/>
                <strong>Location:</strong> ${created.requestedByLocation}<br/>
                <strong>Status:</strong> ${created.status}
                </p>

                <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                    <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;">Item</th>
                    <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;">Unit</th>
                    <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;">Dept</th>
                    <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #ddd;">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${linesHtml}
                </tbody>
                </table>

                <p style="margin:12px 0 0;color:#666;font-size:12px;">
                Request ID: ${created.id}
                </p>
            </div>
            `,
        });

        // ✅ Check for errors
        if (error) {
            console.error("Resend API Error:", error);
            // Don't fail the request, but log the error
            return res.status(201).json({
                id: created.id,
                status: created.status,
                submittedAt: created.submittedAt,
                emailSent: false,
                emailError: error.message
            });
        }

        console.log("Email sent successfully:", data);
        
        return res.status(201).json({
            id: created.id,
            status: created.status,
            submittedAt: created.submittedAt,
            emailSent: true
        });

    } catch (error) {
        console.error("Error creating stock request:", error); // Fixed: actually log the error
        return res.status(500).json({ message: "Failed to create stock request"})
    }
}

function getUserRole(req: Request): string | undefined {
    return (req as any).user?.role
}
export const listStockRequest = async (req: Request, res: Response) =>  {
    try {
        const role = getUserRole(req)

        if(role !== "admin" && role !== "inventoryClerk") {
            return res.status(403).json({message: "Forbbiden"})
        }

        const page = Math.max(1, Number(req.query.page ?? 1));
        const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize ?? 20)));

        const status = (req.query.status as string | undefined) ?? undefined;
        const location = (req.query.location as string | undefined) ?? undefined;
        const search = (req.query.search as string | undefined) ?? undefined;

        const where: any = {}

        if (status) where.status = status;
        if (location) where.requestedByLocation = location;

        if (search) {
            where.OR = [
                {requestedByName: { contains: search, mode: "insensitive"} },
                { requestedByEmail: { contains: search, mode: "insensitive"} },
                {id: {contains:  search, mode: "insensitive"}}
            ];
        }

        const [totalItems, items ] = await Promise.all([
            prisma.stockRequest.count({where}),
            prisma.stockRequest.findMany({
                where,
                orderBy: { submittedAt: "desc"},
                skip: (page -1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    status: true,
                    submittedAt: true,
                    requestedByName: true,
                    requestedByEmail: true,
                    requestedByLocation: true,
                    _count: { select: {lines: true}}
                },
            }),
        ]);

        return res.json({
            items: items.map((r) => ({
                id: r.id,
                status: r.status,
                submittedAt: r.submittedAt,
                requestedByEmail: r.requestedByEmail,
                requestedByName: r.requestedByName,
                requestedByLocation: r.requestedByLocation,
                lineCount: r._count.lines
            })),
            totalItems,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Failed to list stock request"})
    }
}

export const getStockRequestById = async (req: Request, res: Response) => {
    try {
        const role = getUserRole(req);
        if (role !== "admin" && role !=="inventoryClerk")
            return res.status(403).json({message: "Forbidden"})

        const id = req.params.id

        const request = await prisma.stockRequest.findUnique({
            where: {id},
            include: { 
                lines: {
                    orderBy: { createdAt: "asc"},
                    include: {
                        product: {
                            select: {
                                productId:true,
                                name: true,
                                unit: true,
                                Department: true,
                                inventory: {
                                    select: { stockQuantity: true}
                                },
                            },
                        },
                    },
                },
            },
        });

        if(!request) return res.status(404).json({message: "Not Found"})
            console.log("request", request)
        
            return res.json({
                id: request.id,
                status: request.status,
                submittedAt: request.submittedAt,
                requestedByName: request.requestedByName,
                requestedByEmail: request.requestedByEmail,
                requestedByLocation: request.requestedByLocation,
                expectedDeliveryAt: request.expectedDeliveryAt,
                messageToRequester: request.messageToRequester,
                lines: request.lines.map((l) => ({
                    id: l.id,
                    productId: l.productId,
                    productName: l.product.name,
                    unit: l.product.unit,
                    department: l.product.Department,
                    availableQty: l.product.inventory?.stockQuantity ?? null,
                    requestedQty: l.requestedQty,
                    grantedQty: l.grantedQty,
                    outcome: l.outcome,
                    notes: l.notes
                })),
            })
            
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Failed to fetch Request"})
    }
}
//reviewStockRequest
type ReviewStockRequestBody = {
    messageToRequester?: string | null;
    expectedDeliveryAt?: string | null;
    lines: Array<{
        lineId: string;
        grantedQty: number;
        notes?: string | null;
    }>
}

//reviewStockRequest
function getUser(req: Request) {
    return (req as any).user as {id?: string, role?: string} | undefined;
}
//reviewStockRequest
function clamp(n: unknown, min: number, max: number) {
    const x = Math.floor(Number(n));
    if (!Number.isFinite(x)) return min;
    return Math.max(min, Math.min(max,x))
}
//reviewStockRequest
function outcomeForRequest(requestedQty: number, grantedQty: number) {
    if (grantedQty <0) return "UNAVAILABLE";
    if (grantedQty === requestedQty) return "GRANTED";
    return "ADJUSTED"
}

export const reviewStockRequest = async (req: Request, res:Response) => {
    try {
        const user = getUser(req);
        if (!user || (user.role !=="admin" && user.role !=="inventoryClerk")){
            return res.status(403).json({ mesaage: "forbidden"})
        }

        const requestId = req.params.id
        const body = req.body as ReviewStockRequestBody

        if (!body?.lines || !Array.isArray(body.lines) || body.lines.length === 0) {
            return res.status(400).json({message: "lines is required"});
        }

        const existing = await prisma.stockRequest.findUnique({
            where: {id: requestId},
            include: {lines: true}
        })

        if (!existing) return res.status(404).json({ message: "Not Found"});

        const lineById = new Map(existing.lines.map((l) => [l.id, l]))

        for (const l of body.lines){
            if (!lineById.has(l.lineId)) {
                return res.status(400).json({message: `Invalid lineId: ${l.lineId}`})
            }
        }

        const expectedDeliveryAt = body.expectedDeliveryAt 
            ? new Date(body.expectedDeliveryAt)
            : null

            await prisma.$transaction(async (tx) => {
                for (const l of body.lines) {
                    const current = lineById.get(l.lineId)!;
                    const grantedQty = clamp(l.grantedQty, 0, current.requestedQty)

                    await tx.stockRequestLine.update({
                        where: {id: l.lineId},
                        data: {
                            grantedQty,
                            outcome: outcomeForRequest(current.requestedQty, grantedQty) as any,
                            notes: l.notes ?? null,
                        },
                    });
                }
                await tx.stockRequest.update({
                    where: { id: requestId},
                    data: {
                        status: "IN_REVIEW" as any,
                        reviewedByUserId: user.id ?? null,
                        expectedDeliveryAt,
                        messageToRequester: body.messageToRequester ?? null
                    }
                });
            });

            res.json({ok: true})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Failed to review request"})
    }
}

function lineLabel(outcome: string): string {
    const labels: Record<string, string> = {
        GRANTED: "✓ Supplied in full",
        ADJUSTED: "⚠ Partially supplied",
        UNAVAILABLE: "✗ Unavailable"
    };
    return labels[outcome] || outcome;
}

type LineResult = {
    productName: string;
    requestedQty: number;
    grantedQty: number;
    outcome: "GRANTED" | "ADJUSTED" | "UNAVAILABLE";
    unit?: string | null;
    department?: string | null;
};

export const fulfillStockRequest = async (req: Request, res: Response) => {
    const user = getUser(req);

    // Authorization check
    if (!user || (user.role !== "admin" && user.role !== "inventoryClerk")) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const requestId = req.params.id;

    try {
        // Execute fulfillment in transaction
        const fulfilled = await prisma.$transaction(async (tx) => {
            // Fetch request with all related data
            const request = await tx.stockRequest.findUnique({
                where: { id: requestId },
                include: {
                    lines: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    unit: true,
                                    Department: true,
                                    inventory: { 
                                        select: { 
                                            id: true, 
                                            stockQuantity: true 
                                        } 
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!request) {
                throw new Error("NOT_FOUND");
            }

            let anyGranted = false;
            let anyNotFullyGranted = false;
            const linesResults: LineResult[] = [];

            // Process each line item
            for (const line of request.lines) {
                const result = await processStockRequestLine(
                    tx,
                    line,
                    requestId,
                    user.id ?? null,
                    request.requestedByLocation
                );

                linesResults.push(result);

                if (result.grantedQty > 0) {
                    anyGranted = true;
                }

                if (result.outcome !== "GRANTED") {
                    anyNotFullyGranted = true;
                }
            }

            // Determine final status
            const newStatus = determineRequestStatus(anyGranted);

            const updatedRequest = await tx.stockRequest.update({
            where: { id: requestId },
            data: { status: newStatus as any },
            select: {
                id: true,
                status: true,
                requestedByEmail: true,
                requestedByLocation: true,
                expectedDeliveryAt: true,
                messageToRequester: true,
            },
            });


            return { request: updatedRequest, lines: linesResults };
        });

        // Send notification email (outside transaction)
        await sendFulfillmentEmail(fulfilled);

        return res.json({ 
            ok: true, 
            status: fulfilled.request.status 
        });

    } catch (err: any) {
        if (err.message === "NOT_FOUND") {
            return res.status(404).json({ message: "Request not found" });
        }
        
        console.error("Error fulfilling stock request:", err);
        return res.status(500).json({ message: "Failed to fulfill request" });
    }
};

// Helper: Process individual stock request line
async function processStockRequestLine(
    tx: any,
    line: any,
    requestId: string,
    userId: string | null,
    location: string
): Promise<LineResult> {
    const requestedQty = line.requestedQty;
    const desiredGranted = Math.max(
        0,
        Math.min(requestedQty, line.grantedQty ?? requestedQty)
    );

    const inventory = line.product.inventory;
    const available = inventory?.stockQuantity ?? 0;
    let finalGranted = Math.min(desiredGranted, available);

    // If no stock available, mark as unavailable
    if (finalGranted <= 0) {
        await updateLineAsUnavailable(tx, line.id);
        return createLineResult(line, requestedQty, 0, "UNAVAILABLE");
    }

    // Attempt to decrement stock with race condition handling
    const decrementSuccess = await attemptStockDecrement(
        tx,
        line.productId,
        finalGranted
    );

    if (!decrementSuccess) {
        // Retry with current stock level
        const retryResult = await retryStockDecrement(
            tx,
            line.productId,
            desiredGranted
        );

        if (!retryResult.success) {
            await updateLineAsUnavailable(tx, line.id);
            return createLineResult(line, requestedQty, 0, "UNAVAILABLE");
        }

        finalGranted = retryResult.grantedQty;
    }

    // Update product stock quantity
    await tx.products.update({
        where: { productId: line.productId },
        data: { stockQuantity: { decrement: finalGranted } },
    });

    // Create ledger entry
    await tx.stockLedger.create({
        data: {
            productId: line.productId,
            sourceType: "STOCK_REQUEST",
            SourceId: requestId,
            qtyChange: -finalGranted,
            memo: `Fulfilled stock request (${location})`,
            userId: userId,
        },
    });

    // Update line with final granted quantity
    const outcome: "GRANTED" | "ADJUSTED" = 
        finalGranted === requestedQty ? "GRANTED" : "ADJUSTED";

    await tx.stockRequestLine.update({
        where: { id: line.id },
        data: { 
            grantedQty: finalGranted, 
            outcome: outcome as any 
        },
    });

    return createLineResult(line, requestedQty, finalGranted, outcome);
}

// Helper: Attempt to decrement stock
async function attemptStockDecrement(
    tx: any,
    productId: string,
    quantity: number
): Promise<boolean> {
    const result = await tx.inventory.updateMany({
        where: {
            productId: productId,
            stockQuantity: { gte: quantity },
        },
        data: { stockQuantity: { decrement: quantity } },
    });

    return result.count > 0;
}

// Helper: Retry stock decrement with fresh data
async function retryStockDecrement(
    tx: any,
    productId: string,
    desiredQty: number
): Promise<{ success: boolean; grantedQty: number }> {
    const currentInventory = await tx.inventory.findUnique({
        where: { productId },
        select: { stockQuantity: true },
    });

    const available = currentInventory?.stockQuantity ?? 0;
    const grantedQty = Math.min(desiredQty, available);

    if (grantedQty <= 0) {
        return { success: false, grantedQty: 0 };
    }

    const result = await tx.inventory.updateMany({
        where: {
            productId: productId,
            stockQuantity: { gte: grantedQty },
        },
        data: { stockQuantity: { decrement: grantedQty } },
    });

    return {
        success: result.count > 0,
        grantedQty: result.count > 0 ? grantedQty : 0,
    };
}

// Helper: Update line as unavailable
async function updateLineAsUnavailable(tx: any, lineId: string): Promise<void> {
    await tx.stockRequestLine.update({
        where: { id: lineId },
        data: { grantedQty: 0, outcome: "UNAVAILABLE" as any },
    });
}

// Helper: Create line result object
function createLineResult(
    line: any,
    requestedQty: number,
    grantedQty: number,
    outcome: "GRANTED" | "ADJUSTED" | "UNAVAILABLE"
): LineResult {
    return {
        productName: line.product.name,
        requestedQty,
        grantedQty,
        outcome,
        unit: line.product.unit ?? null,
        department: line.product.Department ?? null,
    };
}

// Helper: Determine final request status
function determineRequestStatus(anyGranted: boolean): "FULFILLED" | "CANCELLED" {
  return anyGranted ? "FULFILLED" : "CANCELLED";
}


// Helper: Send fulfillment email
async function sendFulfillmentEmail(fulfilled: any): Promise<void> {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_SENDER_EMAIL) {
        console.log("Email not configured, skipping notification");
        return;
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const rows = fulfilled.lines
            .map(
                (l: LineResult) => `
            <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;">${l.productName}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${l.requestedQty}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${l.grantedQty}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;">${lineLabel(l.outcome)}</td>
            </tr>
        `
            )
            .join("");

        const deliveryLine = fulfilled.request.expectedDeliveryAt
            ? `<p style="margin:8px 0 0;"><strong>Expected delivery:</strong> ${new Date(
                fulfilled.request.expectedDeliveryAt
                ).toLocaleString()}</p>`
            : "";

        const messageLine = fulfilled.request.messageToRequester
            ? `<p style="margin:8px 0 0;"><strong>Message:</strong> ${fulfilled.request.messageToRequester}</p>`
            : "";

        // ✅ Fixed: Use array for 'to' field
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_SENDER_EMAIL as string,
            to: [fulfilled.request.requestedByEmail], // ✅ Array, not string
            replyTo: "huntergaillard3@gmail.com", // Use replyTo if you want to receive replies
            subject: `Stock Request Update — ${fulfilled.request.status}`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="margin:0 0 8px;">Stock Request Update</h2>
                    <p style="margin:0 0 8px;">
                        <strong>Request ID:</strong> ${fulfilled.request.id}<br/>
                        <strong>Location:</strong> ${fulfilled.request.requestedByLocation}<br/>
                        <strong>Status:</strong> ${fulfilled.request.status}
                    </p>
                    ${deliveryLine}
                    ${messageLine}

                    <table style="width:100%;border-collapse:collapse;margin-top:12px;">
                        <thead>
                            <tr>
                                <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;">Item</th>
                                <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #ddd;">Requested</th>
                                <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #ddd;">Supplied</th>
                                <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;">Result</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `,
        });

        // ✅ Check for errors
        if (error) {
            console.error("Resend API Error:", error);
            return;
        }

        console.log("Fulfillment email sent successfully to:", fulfilled.request.requestedByEmail);
    } catch (error) {
        console.error("Failed to send fulfillment email:", error);
        // Don't throw - email failure shouldn't fail the request
    }
}

