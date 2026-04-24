type QueryOptions = {
  iterator?: "Start" | "Continue";
  iteratorID?: string | null;
  fromModifiedDate?: string | null;
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

function formatQBDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
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
      <MaxReturned>100</MaxReturned>${innerBody}
    </${tag}>
${footer}`;
}

function buildContinueQuery(tag: string, requestID: string, iteratorID: string) {
  return `${header}
    <${tag} requestID="${requestID}" iterator="Continue" iteratorID="${escapeXmlAttr(iteratorID)}">
      <MaxReturned>100</MaxReturned>
    </${tag}>
${footer}`;
}

export const queries = {
  customers: (options: QueryOptions = {}) => {
    if (options.iterator === "Continue" && options.iteratorID) {
      return buildContinueQuery("CustomerQueryRq", "customers_001", options.iteratorID);
    }

    return buildStartQuery(
      "CustomerQueryRq",
      "customers_001",
      `
      <ActiveStatus>All</ActiveStatus>${buildModifiedDateFilter(options)}`
    );
  },

  invoices: (options: QueryOptions = {}) => {
    if (options.iterator === "Continue" && options.iteratorID) {
      return buildContinueQuery("InvoiceQueryRq", "invoices_001", options.iteratorID);
    }

    return buildStartQuery(
      "InvoiceQueryRq",
      "invoices_001",
      `${buildModifiedDateFilter(options)}`
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
      `${buildModifiedDateFilter(options)}`
    );
  },

  checks: (options: QueryOptions = {}) => {
    if (options.iterator === "Continue" && options.iteratorID) {
      return buildContinueQuery("CheckQueryRq", "checks_001", options.iteratorID);
    }

    return buildStartQuery(
      "CheckQueryRq",
      "checks_001",
      `${buildModifiedDateFilter(options)}`
    );
  },
};