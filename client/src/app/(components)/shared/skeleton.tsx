import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function SkeletonDemo( {rows = 5} : {rows?: number}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-[200px]" /> {/* title */}
                    <Skeleton className="h-6 w-[200px]" /> {/* Action Button */}
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex items-center gap-3 mb-4">
                    <Skeleton  className="h-10 flex-1 max-w-sm"/>
                    <Skeleton  className="h-10 w-[150px]"/>
                </div>
                
                <div className="rounded-md border">
                    <div className="flex items-center gap-4 bg-muted/50 px-4 border-b font-medium">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[60px] ml-auto" />
                    </div>

                    {/* Rows */}
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                        <Skeleton className="h-4 w-4 rounded-sm" /> {/* Checkbox */}
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-6 w-[100px] rounded-full" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <div className="flex gap-2 ml-auto">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                        </div>
                    ))}
                </div>

                 <div className="flex items-center justify-between mt-4">
                    <Skeleton className="h-4 w-[120px]" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                    </div>
            </CardContent>
        </Card>
    )
}