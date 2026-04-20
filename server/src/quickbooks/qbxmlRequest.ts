const header = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">`;

const footer = `  </QBXMLMsgsRq>
</QBXML>`;

export const queries = {
  customers: () => `${header}
    <CustomerQueryRq requestID="customers_001">
      <MaxReturned>100</MaxReturned>
      <ActiveStatus>All</ActiveStatus>
    </CustomerQueryRq>
${footer}`,

  invoices: () => `${header}
    <InvoiceQueryRq requestID="invoices_001">
      <MaxReturned>100</MaxReturned>
    </InvoiceQueryRq>
${footer}`,

  receivePayments: () => `${header}
    <ReceivePaymentQueryRq requestID="receive_payments_001">
      <MaxReturned>100</MaxReturned>
    </ReceivePaymentQueryRq>
${footer}`,

  checks: () => `${header}
    <CheckQueryRq requestID="checks_001">
      <MaxReturned>100</MaxReturned>
    </CheckQueryRq>
${footer}`,
};