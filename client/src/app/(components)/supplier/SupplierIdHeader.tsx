import { Mail, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Supplier {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export function SupplierHeader({
  supplier,
  overdueCount,
}: {
  supplier: Supplier;
  overdueCount: number;
}) {
  const initials = supplier.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-semibold tracking-tight">{supplier.name}</h1>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-[11px]">
              {overdueCount} overdue
            </Badge>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            {supplier.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
            {supplier.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {supplier.address}
          </span>
        </div>
      </div>
    </div>
  );
}