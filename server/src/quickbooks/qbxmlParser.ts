import { parseStringPromise } from "xml2js";

export type ParsedQBResult =
  | { type: "customers"; data: any[] }
  | { type: "invoices"; data: any[] }
  | { type: "receivePayments"; data: any[] }
  | { type: "checks"; data: any[] }
  | null;

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
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
    return {
      type: "customers",
      data: asArray(msgsRs.CustomerQueryRs.CustomerRet),
    };
  }

  if (msgsRs.InvoiceQueryRs) {
    return {
      type: "invoices",
      data: asArray(msgsRs.InvoiceQueryRs.InvoiceRet),
    };
  }

  if (msgsRs.ReceivePaymentQueryRs) {
    return {
      type: "receivePayments",
      data: asArray(msgsRs.ReceivePaymentQueryRs.ReceivePaymentRet),
    };
  }

  if (msgsRs.CheckQueryRs) {
    return {
      type: "checks",
      data: asArray(msgsRs.CheckQueryRs.CheckRet),
    };
  }

  return null;
}