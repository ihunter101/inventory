import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { LucideIcon } from "lucide-react"

type EmptyStateProps = {
  title: string;
  description: string;
  buttonCTA: string;
  onButtonClick?: () => void;
  icon?: LucideIcon;
}

export function EmptyOutline({
  title,
  description,
  buttonCTA,
  onButtonClick,
  icon: Icon,
}: EmptyStateProps) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {Icon && <Icon className="h-12 w-12 text-gray-400" />}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button 
          onClick={onButtonClick}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300"
          size="sm"
        >
          {buttonCTA}
        </Button>
      </EmptyContent>
    </Empty>
  )
}