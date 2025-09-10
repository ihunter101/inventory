import { CheckCircle, Clock, AlertCircle } from "lucide-react";

type Status =
  | "PENDING"
  | "APPROVED"
  | "RECEIVED"
  | "PARTIALLY_RECEIVED"
  | "PAID"
  | "OVERDUE"
  | "POSTED"
  | "DRAFT";

const StatusBadge = ({ status }: { status: Status }) => {
  const m: Record<string, { bg: string; text: string; Icon: any; label: string }> = {
    PENDING: { bg: "bg-amber-50", text: "text-amber-700", Icon: Clock, label: "Pending" },
    APPROVED: { bg: "bg-sky-50", text: "text-sky-700", Icon: CheckCircle, label: "Approved" },
    RECEIVED: { bg: "bg-emerald-50", text: "text-emerald-700", Icon: CheckCircle, label: "Received" },
    PARTIALLY_RECEIVED: { bg: "bg-indigo-50", text: "text-indigo-700", Icon: CheckCircle, label: "Partially received" },
    PAID: { bg: "bg-emerald-50", text: "text-emerald-700", Icon: CheckCircle, label: "Paid" },
    OVERDUE: { bg: "bg-rose-50", text: "text-rose-700", Icon: AlertCircle, label: "Overdue" },
    POSTED: { bg: "bg-violet-50", text: "text-violet-700", Icon: CheckCircle, label: "Posted" },
    DRAFT: { bg: "bg-slate-50", text: "text-slate-700", Icon: Clock, label: "Draft" },
  };

  const { bg, text, Icon, label } = m[status] ?? m.DRAFT;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${bg} ${text} px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-black/5`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
};

export default StatusBadge;


