import  { ActionDropdown, type ActionItems } from "@/app/(components)/shared/DropdownAction"
import { toast } from "sonner";


export default function MatchActions(){

  const items: ActionItems[] = [
    {
      label: "Download Purchases Report",
      onSelect: () => {},
      variant: "normal"
    },
    {
      label: "Pay Supplier",
      onSelect: () => { },
      variant: "normal"
    }
  ];

  return (
    <>
      <ActionDropdown items={items} />
    </>
  )
}