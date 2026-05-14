//server/src/quickbooks/qbxmlRequest.ts
type QueryOptions = {
  iterator?: "Start" | "Continue";
  iteratorID?: string | null;

  fromModifiedDate?: string | null;

  fromTxnDate?: string | null;
  toTxnDate?: string | null;
};

const header = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">`;

const footer = `  </QBXMLMsgsRq>
</QBXML>`;

function escapeXmlAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Formats a value for QuickBooks TxnDate fields.
 *
 * IMPORTANT:
 * QuickBooks TxnDate fields expect DATE ONLY:
 *
 *   Correct:   2025-06-01
 *   Incorrect: 2025-06-01T00:00:00
 *
 * Use this for:
 * - Invoice TxnDateRangeFilter
 * - Check TxnDateRangeFilter
 * - Payment TxnDateRangeFilter, if needed later
 *
 * Do NOT use this for ModifiedDateRangeFilter.
 * ModifiedDateRangeFilter expects a datetime.
 */
function formatQBDate(value?: string | null) {
  if (!value) return null;

  /**
   * If the value is already in the correct QuickBooks date-only format,
   * return it unchanged.
   *
   * Example:
   * "2025-06-01" stays "2025-06-01"
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  /**
   * If the value came in as a JS/ISO datetime,
   * convert it back down to YYYY-MM-DD.
   *
   * Example:
   * "2025-06-01T00:00:00.000Z" becomes "2025-06-01"
   */
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Builds a QuickBooks TxnDateRangeFilter.
 *
 * TxnDate means the transaction date shown on the invoice.
 *
 * Example:
 *
 * Invoice Date: March 10, 2026
 *
 * That invoice's TxnDate is:
 *
 *   2026-03-10
 *
 * This filter is useful for historical invoice pulls, for example:
 *
 *   "Give me all invoices dated from 2025-06-01 onward."
 *
 * It is NOT the same as ModifiedDate.
 */
function buildTxnDateFilter(options: QueryOptions) {
  const fromTxnDate = formatQBDate(options.fromTxnDate);
  const toTxnDate = formatQBDate(options.toTxnDate);

  if (!fromTxnDate && !toTxnDate) return "";

  return `
      <TxnDateRangeFilter>
        ${fromTxnDate ? `<FromTxnDate>${fromTxnDate}</FromTxnDate>` : ""}
        ${toTxnDate ? `<ToTxnDate>${toTxnDate}</ToTxnDate>` : ""}
      </TxnDateRangeFilter>`;
}


function buildModifiedDateFilter(options: QueryOptions) {
  const formatted = formatQBDate(options.fromModifiedDate);
  if (!formatted) return "";

  return `
      <ModifiedDateRangeFilter>
        <FromModifiedDate>${formatted}</FromModifiedDate>
      </ModifiedDateRangeFilter>`;
}




function buildStartQuery(tag: string, requestID: string, innerBody: string) {
  return `${header}
    <${tag} requestID="${requestID}" iterator="Start">
      <MaxReturned>10</MaxReturned>${innerBody}
    </${tag}>
${footer}`;
}

function buildContinueQuery(tag: string, requestID: string, iteratorID: string) {
  return `${header}
    <${tag} requestID="${requestID}" iterator="Continue" iteratorID="${escapeXmlAttr(iteratorID)}">
      <MaxReturned>10</MaxReturned>
    </${tag}>
${footer}`;
}

export const queries = {
  customers: (options: QueryOptions = {}) => {
    if (options.iterator === "Continue" && options.iteratorID) {
      return buildContinueQuery(
        "CustomerQueryRq",
        "customers_001",
        options.iteratorID
      );
    }

    return buildStartQuery(
      "CustomerQueryRq",
      "customers_001",
      `
      <ActiveStatus>All</ActiveStatus>
      ${buildModifiedDateFilter(options)}
      `
    );
  },


invoices: (options: QueryOptions = {}) => {
  if (options.iterator === "Continue" && options.iteratorID) {
    return `${header}
    <InvoiceQueryRq requestID="invoices_001" iterator="Continue" iteratorID="${escapeXmlAttr(options.iteratorID)}">
      <MaxReturned>10</MaxReturned>
      <IncludeLineItems>true</IncludeLineItems>
    </InvoiceQueryRq>
${footer}`;
  }

  const dateFilter = 
    options.fromTxnDate || options.toTxnDate
      ? buildTxnDateFilter(options)
      : buildModifiedDateFilter(options);

  return buildStartQuery(
    "InvoiceQueryRq",
    "invoices_001",
    `
      ${dateFilter}
      <IncludeLineItems>true</IncludeLineItems>
    `
  );
},

  receivePayments: (options: QueryOptions = {}) => {
    if (options.iterator === "Continue" && options.iteratorID) {
      return buildContinueQuery(
        "ReceivePaymentQueryRq",
        "receive_payments_001",
        options.iteratorID
      );
    }

    return buildStartQuery(
      "ReceivePaymentQueryRq",
      "receive_payments_001",
      `
      ${buildModifiedDateFilter(options)}
      `
    );
  },

  checks: (options: QueryOptions = {}) => {
    if (options.iterator === "Continue" && options.iteratorID) {
      return buildContinueQuery(
        "CheckQueryRq",
        "checks_001",
        options.iteratorID
      );
    }

    return buildStartQuery(
      "CheckQueryRq",
      "checks_001",
      `
      ${buildModifiedDateFilter(options)}
      `
    );
  },
};