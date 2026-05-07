import { PaymentMethod } from "@prisma/client";
import { escapeXml } from "./xmlUtils";

type BuildReceivePaymentAddRqParams = {
  requestId: string;
  customerListId: string;
  invoiceTxnId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod?: PaymentMethod | null;
  referenceNumber?: string | null;
  memo?: string | null;
};

function formatQBDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPaymentMethodLabel(method?: PaymentMethod | null) {
  switch (method) {
    case PaymentMethod.CASH:
      return "Cash";
    case PaymentMethod.CREDIT_CARD:
      return "Credit Card";
    case PaymentMethod.DEBIT_CARD:
      return "Debit Card";
    case PaymentMethod.BANK_TRANSFER:
      return "Bank Transfer";
    case PaymentMethod.CHEQUE:
      return "Cheque";
    case PaymentMethod.OTHER:
    default:
      return "Other";
  }
}

export function buildReceivePaymentAddRqInner(
  params: BuildReceivePaymentAddRqParams
) {
  const {
    requestId,
    customerListId,
    invoiceTxnId,
    paymentDate,
    amount,
    paymentMethod,
    referenceNumber,
    memo = "Payment recorded from custom app",
  } = params;

  const safeAmount = amount.toFixed(2);
  const methodLabel = getPaymentMethodLabel(paymentMethod);

  return `
    <ReceivePaymentAddRq requestID="${escapeXml(requestId)}">
      <ReceivePaymentAdd>
        <CustomerRef>
          <ListID>${escapeXml(customerListId)}</ListID>
        </CustomerRef>

        <TxnDate>${escapeXml(formatQBDate(paymentDate))}</TxnDate>
        ${
          referenceNumber
            ? `<RefNumber>${escapeXml(referenceNumber)}</RefNumber>`
            : ""
        }
        <TotalAmount>${safeAmount}</TotalAmount>

        <Memo>${escapeXml(`${memo} | Method: ${methodLabel}`)}</Memo>

        <DepositToAccountRef>
          <FullName>Undeposited Funds</FullName>
        </DepositToAccountRef>

        <AppliedToTxnAdd>
          <TxnID>${escapeXml(invoiceTxnId)}</TxnID>
          <PaymentAmount>${safeAmount}</PaymentAmount>
        </AppliedToTxnAdd>
      </ReceivePaymentAdd>
    </ReceivePaymentAddRq>`;
}

export function buildReceivePaymentBatchAddRq(
  payments: BuildReceivePaymentAddRqParams[]
) {
  const requestBlocks = payments.map(buildReceivePaymentAddRqInner).join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    ${requestBlocks}
  </QBXMLMsgsRq>
</QBXML>`;
}