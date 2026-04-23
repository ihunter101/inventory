//server/src/quickbooks/qbxmlRequest.ts
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

function buildIteratorAttrs(options: QueryOptions) {
  if (options.iterator === "Start") {
    return ` iterator="Start"`;
  }

  if (options.iterator === "Continue" && options.iteratorID) {
    return ` iterator="Continue" iteratorID="${options.iteratorID}"`;
  }

  return "";
}

function buildModifiedDateFilter(options: QueryOptions) {
  if (!options.fromModifiedDate) return "";

  return `
      <ModifiedDateRangeFilter>
        <FromModifiedDate>${options.fromModifiedDate}</FromModifiedDate>
      </ModifiedDateRangeFilter>`;
}

export const queries = {
  customers: (options: QueryOptions = {}) => `${header}
    <CustomerQueryRq requestID="customers_001"${buildIteratorAttrs(options)}>
      <MaxReturned>100</MaxReturned>
      <ActiveStatus>All</ActiveStatus>${buildModifiedDateFilter(options)}
    </CustomerQueryRq>
${footer}`,

  invoices: (options: QueryOptions = {}) => `${header}
    <InvoiceQueryRq requestID="invoices_001"${buildIteratorAttrs(options)}>
      <MaxReturned>100</MaxReturned>${buildModifiedDateFilter(options)}
    </InvoiceQueryRq>
${footer}`,

  receivePayments: (options: QueryOptions = {}) => `${header}
    <ReceivePaymentQueryRq requestID="receive_payments_001"${buildIteratorAttrs(options)}>
      <MaxReturned>100</MaxReturned>${buildModifiedDateFilter(options)}
    </ReceivePaymentQueryRq>
${footer}`,

  checks: (options: QueryOptions = {}) => `${header}
    <CheckQueryRq requestID="checks_001"${buildIteratorAttrs(options)}>
      <MaxReturned>100</MaxReturned>${buildModifiedDateFilter(options)}
    </CheckQueryRq>
${footer}`,
};