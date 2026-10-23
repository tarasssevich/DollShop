import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="py-10 sm:py-16 bg-alabaster">
      <Container className="space-y-10 sm:space-y-12">
        {/* Header Skeleton */}
        <div className="max-w-3xl space-y-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-linen-dark bg-white overflow-hidden p-4 space-y-4 shadow-xs"
            >
              {/* Photo skeleton */}
              <Skeleton className="aspect-[4/5] w-full rounded-xl" />

              {/* Text skeleton */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
                <Skeleton className="h-6 w-4/5 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
              </div>

              {/* Button skeleton */}
              <div className="pt-2">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
