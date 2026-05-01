import OpenAI from "openai";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ExtractedExpenseData = {
  category: string;
  amount: number;
  description: string | null;
  group: "CLINICAL" | "EQUIPMENT_INFRASTRUCTURE" | "LOGISTICS_OVERHEAD";
  notes: string | null;

  supplierName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;

  subtotal: number | null;
  tax: number | null;
  total: number | null;

  confidence: number;
  missingFields: string[];

  lineItems: {
    description: string | null;
    quantity: number | null;
    unitPrice: number | null;
    total: number | null;
  }[];
};

const expenseExtractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: {
      type: "string",
      description:
        "Short expense category, for example Medical Supplies, Equipment, Repairs, Transport, Utilities, Office Supplies.",
    },
    amount: {
      type: "number",
      description:
        "The best expense amount to save. Usually total if available, otherwise subtotal.",
    },
    description: {
      type: ["string", "null"],
      description: "Short human-readable description of the expense.",
    },
    group: {
      type: "string",
      enum: ["CLINICAL", "EQUIPMENT_INFRASTRUCTURE", "LOGISTICS_OVERHEAD"],
      description:
        "Choose CLINICAL for lab/medical supplies, EQUIPMENT_INFRASTRUCTURE for machines/equipment/building items, LOGISTICS_OVERHEAD for transport/admin/general operations.",
    },
    notes: {
      type: ["string", "null"],
      description:
        "Important review notes for the admin, especially if some fields are uncertain.",
    },

    supplierName: {
      type: ["string", "null"],
    },
    invoiceNumber: {
      type: ["string", "null"],
    },
    invoiceDate: {
      type: ["string", "null"],
      description: "Invoice date in YYYY-MM-DD format if visible.",
    },
    dueDate: {
      type: ["string", "null"],
      description: "Due date in YYYY-MM-DD format if visible.",
    },

    subtotal: {
      type: ["number", "null"],
    },
    tax: {
      type: ["number", "null"],
    },
    total: {
      type: ["number", "null"],
    },

    confidence: {
      type: "number",
      description: "Confidence from 0 to 1.",
    },
    missingFields: {
      type: "array",
      items: {
        type: "string",
      },
    },

    lineItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          description: {
            type: ["string", "null"],
          },
          quantity: {
            type: ["number", "null"],
          },
          unitPrice: {
            type: ["number", "null"],
          },
          total: {
            type: ["number", "null"],
          },
        },
        required: ["description", "quantity", "unitPrice", "total"],
      },
    },
  },
  required: [
    "category",
    "amount",
    "description",
    "group",
    "notes",
    "supplierName",
    "invoiceNumber",
    "invoiceDate",
    "dueDate",
    "subtotal",
    "tax",
    "total",
    "confidence",
    "missingFields",
    "lineItems",
  ],
} as const;

async function downloadPdfToTempFile(fileUrl: string) {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`Failed to download PDF. Status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");

  if (contentType && !contentType.includes("pdf")) {
    console.warn("Downloaded file may not be a PDF. Content-Type:", contentType);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const tempFilePath = path.join(os.tmpdir(), `invoice-${randomUUID()}.pdf`);

  await fs.promises.writeFile(tempFilePath, buffer);

  return tempFilePath;
}

function normalizeExtractedExpenseData(data: ExtractedExpenseData): ExtractedExpenseData {
  const allowedGroups = [
    "CLINICAL",
    "EQUIPMENT_INFRASTRUCTURE",
    "LOGISTICS_OVERHEAD",
  ] as const;

  const group = allowedGroups.includes(data.group)
    ? data.group
    : "CLINICAL";

  const amount =
    typeof data.amount === "number" && Number.isFinite(data.amount)
      ? data.amount
      : data.total ?? data.subtotal ?? 0;

  const confidence =
    typeof data.confidence === "number"
      ? Math.min(Math.max(data.confidence, 0), 1)
      : 0;

  return {
    ...data,
    group,
    amount,
    confidence,
    lineItems: Array.isArray(data.lineItems) ? data.lineItems : [],
    missingFields: Array.isArray(data.missingFields) ? data.missingFields : [],
  };
}

export async function extractExpenseDataFromPdf(
  fileUrl: string
): Promise<ExtractedExpenseData> {
  let tempFilePath: string | null = null;
  let uploadedFileId: string | null = null;

  try {
    tempFilePath = await downloadPdfToTempFile(fileUrl);

    const uploadedFile = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: "user_data",
    });

    uploadedFileId = uploadedFile.id;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You extract accounting expense data from invoice PDFs. " +
                "Return only facts visible in the invoice. Do not invent supplier names, invoice numbers, dates, or totals. " +
                "If a value is missing or unclear, use null and add the field name to missingFields. " +
                "Choose the expense group carefully based on the invoice content.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: uploadedFile.id,
            },
            {
              type: "input_text",
              text:
                "Extract the invoice data for an expense form. " +
                "The final form fields are category, amount, description, group, and notes. " +
                "Also extract supplierName, invoiceNumber, invoiceDate, dueDate, subtotal, tax, total, and lineItems if visible.",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "expense_invoice_extraction",
          strict: true,
          schema: expenseExtractionSchema,
        },
      },
    });

    const rawText = response.output_text;

    if (!rawText) {
      throw new Error("AI returned no extraction text.");
    }

    const parsed = JSON.parse(rawText) as ExtractedExpenseData;

    return normalizeExtractedExpenseData(parsed);
  } finally {
    if (tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }

    if (uploadedFileId) {
      await openai.files.delete(uploadedFileId).catch(() => {});
    }
  }
}