import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function RepliesLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <Skeleton className="h-8 w-36" />
      <Card>
        <CardContent className="divide-y p-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
