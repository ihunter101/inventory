//server/src/quickbooks/qbxmlParser.ts
import { parseStringPromise } from "xml2js";

export type ParsedQBResult =
  | {
      type: "customers";
      data: any[];
      iteratorID: string | null;
      remainingCount: number;
    }
  | {
      type: "invoices";
      data: any[];
      iteratorID: string | null;
      remainingCount: number;
    }
  | {
      type: "receivePayments";
      data: any[];
      iteratorID: string | null;
      remainingCount: number;
    }
  | {
      type: "checks";
      data: any[];
      iteratorID: string | null;
      remainingCount: number;
    }
  | null;

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getIteratorMeta(node: any) {
  return {
    iteratorID: node?.$?.iteratorID ?? null,
    remainingCount: Number(node?.$?.iteratorRemainingCount ?? 0),
  };
}

export async function parseQBResponse(xml: string): Promise<ParsedQBResult> {
  if (!xml || !xml.trim()) return null;

  const parsed = await parseStringPromise(xml, {
    explicitArray: false,
    ignoreAttrs: false,
  });

  const msgsRs = parsed?.QBXML?.QBXMLMsgsRs;
  if (!msgsRs) return null;

  if (msgsRs.CustomerQueryRs) {
    const meta = getIteratorMeta(msgsRs.CustomerQueryRs);

    return {
      type: "customers",
      data: asArray(msgsRs.CustomerQueryRs.CustomerRet),
      iteratorID: meta.iteratorID,
      remainingCount: meta.remainingCount,
    };
  }

  if (msgsRs.InvoiceQueryRs) {
    const meta = getIteratorMeta(msgsRs.InvoiceQueryRs);

    return {
      type: "invoices",
      data: asArray(msgsRs.InvoiceQueryRs.InvoiceRet),
      iteratorID: meta.iteratorID,
      remainingCount: meta.remainingCount,
    };
  }

  if (msgsRs.ReceivePaymentQueryRs) {
    const meta = getIteratorMeta(msgsRs.ReceivePaymentQueryRs);

    return {
      type: "receivePayments",
      data: asArray(msgsRs.ReceivePaymentQueryRs.ReceivePaymentRet),
      iteratorID: meta.iteratorID,
      remainingCount: meta.remainingCount,
    };
  }

  if (msgsRs.CheckQueryRs) {
    const meta = getIteratorMeta(msgsRs.CheckQueryRs);

    return {
      type: "checks",
      data: asArray(msgsRs.CheckQueryRs.CheckRet),
      iteratorID: meta.iteratorID,
      remainingCount: meta.remainingCount,
    };
  }

  return null;
}