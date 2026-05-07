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

function toQuickBooksPaymentMethod(method?: PaymentMethod | null) {
  switch (method) {
    case PaymentMethod.CASH:
      return "Cash";
    case PaymentMethod.CREDIT_CARD:
      return "Credit Card";
    case PaymentMethod.DEBIT_CARD:
      return "Debit Card";
    case PaymentMethod.BANK_TRANSFER:
      return "E-Check";
    case PaymentMethod.CHEQUE:
      return "Check";
    case PaymentMethod.OTHER:
    default:
      return "Check";
  }
}

export function buildReceivePaymentAddRq(params: BuildReceivePaymentAddRqParams) {
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
  const qbPaymentMethod = toQuickBooksPaymentMethod(paymentMethod);

  return `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
    <ReceivePaymentAddRq requestID="${escapeXml(requestId)}">
      <ReceivePaymentAdd>
        <CustomerRef>
          <ListID>${escapeXml(customerListId)}</ListID>
        </CustomerRef>

        <TxnDate>${escapeXml(formatQBDate(paymentDate))}</TxnDate>
        ${referenceNumber ? `<RefNumber>${escapeXml(referenceNumber)}</RefNumber>` : ""}
        <TotalAmount>${safeAmount}</TotalAmount>

        <PaymentMethodRef>
          <FullName>${escapeXml(qbPaymentMethod)}</FullName>
        </PaymentMethodRef>

        <Memo>${escapeXml(memo)}</Memo>

        <DepositToAccountRef>
          <FullName>Undeposited Funds</FullName>
        </DepositToAccountRef>

        <AppliedToTxnAdd>
          <TxnID>${escapeXml(invoiceTxnId)}</TxnID>
          <PaymentAmount>${safeAmount}</PaymentAmount>
        </AppliedToTxnAdd>
      </ReceivePaymentAdd>
    </ReceivePaymentAddRq>
  </QBXMLMsgsRq>
</QBXML>`;
}