import { Skeleton } from "@/components/ui/skeleton";

export function JobSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-4">
      <span className="text-sm font-extrabold">Buscando vagas…</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mr-1.5 flex flex-col gap-3.5 border-3 border-foreground bg-card p-4" style={{ opacity: 1 - i * 0.2 }}>
          <div className="flex gap-3">
            <div className="size-[52px] shrink-0 bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-[18px] w-4/5" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-[18px] w-2/5" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-[22px] w-[90px]" />
            <Skeleton className="h-[22px] w-[70px]" />
          </div>
          <div className="flex justify-between border-t-2 border-muted pt-3">
            <Skeleton className="h-5 w-[110px]" />
            <Skeleton className="h-11 w-[140px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
