// "use client"

// import {
//     useGetQuickBooksSummaryQuery,
//     useGetQuickBooksInvoicesQuery,
//     useGetQuickBooksPaymentsQuery,
//     useGetQuickBooksChequesQuery,
// } from "@/app/state/api";

// export default function QuickBooksPage() {
//     const { data: summary, isLoading: summaryLoading } = useGetQuickBooksSummaryQuery()

//     const { data: invoices = [], isLoading: invoicesLoading } = useGetQuickBooksInvoicesQuery()

//     const { data: payments = [] } = useGetQuickBooksPaymentsQuery();

//     const { data: cheques = [] } = useGetQuickBooksChequesQuery();

//     if (summaryLoading || invoicesLoading) {
//         return <main className="p-6>">Loading Quickbooks Data....</main>
//     }

//     return (
//         <main className="p-6 space-y-8">
//             <div>
//                 <h1 className="text-3xl font-bold">Quickbooks Finance</h1>
//                 <p className="text-sm text-muted-foreground">
//                     synced Invoices, Payments Recieved and Cheques from Quickbooks Desktop
//                 </p>
//             </div>

//             <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <CardStat title="Customers" value={summary?.customerCount ?? 0}/>
//                 <CardStat title="Invoices" value={summary?.invoicesCOunt ??0}/>
//                 <CardStat title="Payments Received" value={summary?.paymentCount ?? 0}/>
//                 <CardStat title="Cheques Paid" value={summary?.chequeCount} />
//             </section>

//             <section className="space-y-3">
//                 <h2 className="text-xl font-semibold">Recent Invoices</h2>

//                 <div className="rounded-xl border overflow-hidden">
//                     <table className="w-full text-sm">
//                         <thead className="bg-muted">
//                             <tr>
//                                 <th className="p-3 text-left">Invoice #</th>
//                                 <th className="p-3 text-left">Customer</th>
//                                 <th className="p-3 text-left">Date</th>
//                                 <th className="p-3 text-right">Total</th>
//                                 <th className="p-3 text-right">Balance</th>
//                                 <th className="p-3 text-left">Status</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {invoices.slice(0,10).map((invoice: any) => (
//                                 <tr key={invoice.invoiceId} className="border-t">
//                                     <td className="p3">{invoice.invoiceNUmber ?? "-"}</td>
//                                      <td className="p-3">{invoice.customerName}</td>
//                                     <td className="p-3">{formatDate(invoice.invoiceDate)}</td>
//                                     <td className="p-3 text-right">
//                                         ${Number(invoice.totalAmount ?? 0).toFixed(2)}
//                                     </td>
//                                     <td className="p-3 text-right">
//                                         ${Number(invoice.balanceRemaining ?? 0).toFixed(2)}
//                                     </td>
//                                     <td className="p-3">{invoice.status}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </section>

//             <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <MiniList
//           title="Recent Payments Received"
//           rows={payments.slice(0, 8).map((p: any) => ({
//             id: p.paymentId,
//             left: p.customerName,
//             right: `$${Number(p.amount ?? 0).toFixed(2)}`,
//             sub: formatDate(p.paymentDate),
//           }))}
//         />

//         <MiniList
//           title="Recent Cheques Paid"
//           rows={cheques.slice(0, 8).map((c: any) => ({
//             id: c.chequePaymentId,
//             left: c.payeeName,
//             right: `$${Number(c.amount ?? 0).toFixed(2)}`,
//             sub: formatDate(c.chequeDate),
//           }))}
//         />
//       </section>
//         </main>
//     )
// }


// function CardStat({title, value}: {title: string, value: number}) {
//     return (
//         <div className="rounded-xl border p-4 bg-card">
//             <p className="text-sm text-muted-foreground">{title}</p>
//             <p className="text-3xl font-bold">{value}</p>
//         </div>
//     )
// }

// function MiniList({
//     title,
//     rows,
// }: {title: string, rows: { id: string, left: string, right: string, sub?: string}[]}) {
//     return (
//         <div className=" rounded-xl border p-4 bg-card">
//             <h2 className="text-lg font-semibold">{title}</h2>

//             <div className="space-y-3">
//                 {rows.map((row) => (
//                     <div key={row.id} className="flex items-center justify-between border-border ppb-2">
//                         <div>
//                             <p className="font-medium">{row.left}</p>
//                             <p className="text-xs text-muted-foreground">{row.sub}</p>
//                         </div>
//                         <p className="font-semibold">{row.right}</p>
//                     </div>
//                 ))}
//                 {rows.length === 0 && (
//                 <p className="text-sm text-muted-foreground">No records found.</p>
//                 )}
//             </div>
//         </div>
//     )
// }

// function formatDate(value?: string | null) {
//   if (!value) return "-";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleDateString();
// }



import QuickbooksSyncStatus from "@/app/(components)/quickbooks/QuickbooksSyncStatus";
import QuickbooksInvoiceTable from "@/app/(components)/quickbooks/QuickbooksInvoiceTable";
import QuickbooksPaymentTable from "@/app/(components)/quickbooks/QuickbooksPaymentTable";
import QuickbooksChequeTable from "@/app/(components)/quickbooks/QuickbooksChequeTable";

export default function QuickBooksPage() {
  return (
    <main className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QuickBooks Finance</h1>
        <p className="text-sm text-muted-foreground">
          Synced customer invoices, payments received, and cheques from QuickBooks Desktop.
        </p>
      </div>

      <QuickbooksSyncStatus />

      <QuickbooksInvoiceTable />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QuickbooksPaymentTable />
        <QuickbooksChequeTable />
      </div>
    </main>
  );
}
